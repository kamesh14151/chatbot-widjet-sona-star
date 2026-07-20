import { type NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";

export async function POST(req: NextRequest) {
	try {
		const { name, email, phone } = await req.json();

		if (!name || !email || !phone) {
			return NextResponse.json(
				{ error: "Name, email, and phone are required." },
				{ status: 400 }
			);
		}

		// 1. Get Client IP Address
		let ip =
			req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
			req.headers.get("x-real-ip")?.trim() ||
			"";

		// Handle local/loopback IPs for testing
		if (!ip || ip === "::1" || ip === "127.0.0.1") {
			// Try to fetch a public IP for testing, or default
			try {
				const publicIpRes = await fetch("https://api.ipify.org?format=json");
				const data = await publicIpRes.json();
				ip = data.ip || ip;
			} catch (e) {
				console.warn("Could not fetch public IP for loopback fallback", e);
			}
		}

		// 2. Query IP-based Location
		let locationInfo = "Unknown Location";
		try {
			if (ip && ip !== "::1" && ip !== "127.0.0.1") {
				const locRes = await fetch(`http://ip-api.com/json/${ip}`);
				const locData = await locRes.json();
				if (locData.status === "success") {
					locationInfo = `${locData.city}, ${locData.regionName}, ${locData.country} (${locData.zip || "No ZIP"}) [ISP: ${locData.isp}]`;
				}
			}
		} catch (e) {
			console.error("Failed to fetch geolocation for IP:", ip, e);
		}

		// 3. Load email config (admin-configurable via dashboard, falls back to env vars)
		const { readEmailConfig } = await import('@/app/api/admin/email-config/route');
		const cfg = readEmailConfig();

		const smtpUser = cfg.smtpUser;
		const smtpPass = cfg.smtpPass;
		const smtpHost = cfg.smtpHost;
		const smtpPort = Number(cfg.smtpPort || 465);
		const fromName = cfg.fromName;
		const leadEmailTo = cfg.leadEmailTo;
		const subjectPrefix = cfg.subjectPrefix;
		const isGmail = smtpHost.includes("gmail");

		let transporter: nodemailer.Transporter;

		if (smtpUser && smtpPass) {
			if (isGmail) {
				transporter = nodemailer.createTransport({
					service: "gmail",
					auth: { user: smtpUser, pass: smtpPass },
				});
			} else {
				transporter = nodemailer.createTransport({
					host: smtpHost,
					port: smtpPort,
					secure: smtpPort === 465,
					auth: { user: smtpUser, pass: smtpPass },
				});
			}

			await transporter.sendMail({
				from: `"${fromName}" <${smtpUser}>`,
				to: leadEmailTo,
				subject: `${subjectPrefix}: ${name}`,
				html: `
					<h2>New Lead captured in SCALE UWA Chatbot</h2>
					<p><strong>Name:</strong> ${name}</p>
					<p><strong>Email:</strong> ${email}</p>
					<p><strong>Phone:</strong> ${phone}</p>
					<hr />
					<p><strong>User IP Address:</strong> ${ip}</p>
					<p><strong>IP-Based Location:</strong> ${locationInfo}</p>
				`,
			});

			console.log(`Email sent to ${leadEmailTo} for lead: ${name}`);
		} else {
			console.log("-----------------------------------------");
			console.log("Lead captured (No SMTP credentials configured):");
			console.log(`Name: ${name}, Email: ${email}, Phone: ${phone}`);
			console.log(`IP: ${ip}, Location: ${locationInfo}`);
			console.log("Configure email in Admin Panel → Email Settings.");
			console.log("-----------------------------------------");
		}

		return NextResponse.json({ success: true, location: locationInfo, ip });
	} catch (error: any) {
		console.error("Error in send-details API:", error);
		return NextResponse.json(
			{ error: error.message || "Failed to process lead details" },
			{ status: 500 }
		);
	}
}
