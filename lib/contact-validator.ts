// Utility for strict validation of Name, Email, and 10-digit Indian Mobile Numbers
// Prevents disposable emails, fake test domains, dummy numbers (e.g. 9999999999, 1234567890), and invalid formats.

const BANNED_EMAIL_DOMAINS = new Set([
	'tempmail.com', 'mailinator.com', '10minutemail.com', 'dispostable.com',
	'trashmail.com', 'guerrillamail.com', 'yopmail.com', 'fake.com',
	'test.com', 'example.com', 'asdf.com', 'qwerty.com', '123.com',
	'temp-mail.org', 'dropmail.me', 'fakeinbox.com', 'sharklasers.com',
	'getnada.com', 'disposable.com', 'throwaway.com', 'mail.com', 'random.com'
]);

const BANNED_EMAIL_PREFIXES = [
	'test', 'asdf', 'fake', 'qwerty', '123', 'admin', 'guest', 'aaa', 'abc', 'foo', 'bar', 'dummy'
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export function validateEmail(email: string): { valid: boolean; error?: string } {
	const trimmed = email.trim().toLowerCase();
	if (!trimmed) {
		return { valid: false, error: 'Email address is required.' };
	}
	if (!EMAIL_REGEX.test(trimmed)) {
		return { valid: false, error: 'Please enter a valid email address (e.g., name@gmail.com).' };
	}

	const [prefix, domain] = trimmed.split('@');
	if (BANNED_EMAIL_DOMAINS.has(domain)) {
		return { valid: false, error: 'Disposable or temporary email domains are not allowed.' };
	}

	if (BANNED_EMAIL_PREFIXES.includes(prefix)) {
		return { valid: false, error: 'Please enter your actual email address.' };
	}

	return { valid: true };
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
	// Strip all non-digit characters
	let digits = phone.replace(/[^0-9]/g, '');

	// Handle +91 or 91 country code prefix or leading 0
	if (digits.length === 12 && digits.startsWith('91')) {
		digits = digits.slice(2);
	} else if (digits.length === 11 && digits.startsWith('0')) {
		digits = digits.slice(1);
	}

	// Must be EXACTLY 10 digits
	if (digits.length !== 10) {
		return { valid: false, error: 'Mobile number must be exactly 10 digits.' };
	}

	// Indian mobile numbers MUST start with 6, 7, 8, or 9
	if (!/^[6-9]\d{9}$/.test(digits)) {
		return { valid: false, error: 'Indian mobile numbers must start with 6, 7, 8, or 9.' };
	}

	// Reject repetitive numbers like 9999999999, 0000000000, 1111111111, 8888888888, 7777777777
	if (/^(\d)\1+$/.test(digits)) {
		return { valid: false, error: 'Please enter a valid active 10-digit mobile number.' };
	}

	// Reject sequential or common fake dummy series
	const DUMMY_SERIES = [
		'1234567890', '9876543210', '0123456789', '9876500000',
		'1234512345', '9999900000', '0000099999', '9876598765',
		'6789067890', '9999999999', '8888888888', '7777777777', '6666666666'
	];
	if (DUMMY_SERIES.includes(digits) || digits.includes('123456789') || digits.includes('987654321')) {
		return { valid: false, error: 'Please enter a genuine 10-digit mobile number.' };
	}

	return { valid: true };
}

export function validateName(name: string): { valid: boolean; error?: string } {
	const trimmed = name.trim();
	if (trimmed.length < 2) {
		return { valid: false, error: 'Full Name must be at least 2 letters.' };
	}

	const lower = trimmed.toLowerCase();
	const FAKE_NAMES = ['test', 'asdf', 'qwerty', 'abc', '123', 'admin', 'guest', 'user', 'foo', 'bar', 'fake', 'dummy', 'nobody', 'student'];
	if (FAKE_NAMES.includes(lower) || /^\d+$/.test(trimmed)) {
		return { valid: false, error: 'Please enter your actual name.' };
	}

	return { valid: true };
}
