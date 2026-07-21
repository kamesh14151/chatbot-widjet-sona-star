import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/scaletechschool';

const mongoOptions = {
	serverSelectionTimeoutMS: 3000,
	connectTimeoutMS: 3000,
};

let clientPromise: Promise<MongoClient> | null = null;

if (uri) {
	if (process.env.NODE_ENV === 'development') {
		const globalWithMongo = global as typeof globalThis & {
			_mongoClientPromise?: Promise<MongoClient>;
		};

		if (!globalWithMongo._mongoClientPromise) {
			const client = new MongoClient(uri, mongoOptions);
			globalWithMongo._mongoClientPromise = client.connect();
		}
		clientPromise = globalWithMongo._mongoClientPromise;
	} else {
		const client = new MongoClient(uri, mongoOptions);
		clientPromise = client.connect();
	}
}

export async function getMongoDb(): Promise<Db | null> {
	if (!clientPromise) return null;
	try {
		const client = await clientPromise;
		return client.db();
	} catch (error) {
		console.warn("Primary MongoDB connection timeout or error:", error instanceof Error ? error.message : error);
		// Fallback attempt to local MongoDB if primary IP is unreachable locally
		if (uri.includes('161.248.37.193')) {
			try {
				const localClient = new MongoClient('mongodb://127.0.0.1:27017/scaletechschool', mongoOptions);
				const connectedLocal = await localClient.connect();
				return connectedLocal.db();
			} catch (localErr) {
				// Silent fallback
			}
		}
		return null;
	}
}
