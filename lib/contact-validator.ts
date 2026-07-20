// Utility for strict validation of Name, Email, and Phone numbers
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
	const digits = phone.replace(/[^0-9]/g, '');

	if (digits.length < 10 || digits.length > 15) {
		return { valid: false, error: 'Phone number must be a valid 10-digit mobile number.' };
	}

	// Reject repetitive numbers like 9999999999, 0000000000, 1111111111, 8888888888
	if (/^(\d)\1+$/.test(digits)) {
		return { valid: false, error: 'Please enter a valid, active phone number.' };
	}

	// Reject sequential or dummy patterns like 1234567890, 9876543210, 1234512345
	if (
		digits.includes('123456789') ||
		digits.includes('987654321') ||
		digits.includes('012345678') ||
		digits.includes('1234512345') ||
		digits.includes('9999900000') ||
		digits.includes('0000099999')
	) {
		return { valid: false, error: 'Please enter a valid phone number (no dummy series).' };
	}

	// For Indian phone numbers (10 digits or 12 digits starting with 91)
	if (digits.length === 10) {
		if (!/^[6-9]\d{9}$/.test(digits)) {
			return { valid: false, error: 'Mobile numbers must start with 6, 7, 8, or 9.' };
		}
	} else if (digits.length === 12 && digits.startsWith('91')) {
		const mobilePart = digits.slice(2);
		if (!/^[6-9]\d{9}$/.test(mobilePart)) {
			return { valid: false, error: 'Please enter a valid 10-digit mobile number.' };
		}
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
