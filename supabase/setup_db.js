const SUPABASE_URL = 'https://hgkapxvhucrrzsjseekj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imhna2FweHZodWNycnpzanNlZWtqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1ODM5NzksImV4cCI6MjA4NzE1OTk3OX0._OchiprzYwshBMHe5HDigTJeXSFvMj3u5zr_7YhwMVM';

const DEFAULT_USERS = [
    { email: 'cropguard.farmer1@gmail.com', password: 'farmer123!', name: 'Ravi Kumar' },
    { email: 'cropguard.farmer2@gmail.com', password: 'farmer123!', name: 'Priya Devi' },
    { email: 'cropguard.admin@gmail.com', password: 'admin12345', name: 'Admin' },
];

const SAMPLE_SCANS = {
    'cropguard.farmer1@gmail.com': [
        {
            disease: 'Tomato - Late Blight',
            confidence: 0.92,
            recommendation: 'Remove and destroy infected plants immediately. Apply copper-based fungicide every 7-10 days. Improve air circulation by pruning.',
            image_uri: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=400',
        },
        {
            disease: 'Potato - Early Blight',
            confidence: 0.84,
            recommendation: 'Apply chlorothalonil or mancozeb fungicide at first symptoms. Remove infected plant debris after harvest. Practice crop rotation.',
            image_uri: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=400',
        },
        {
            disease: 'Corn (maize) - Common Rust',
            confidence: 0.78,
            recommendation: 'Apply foliar fungicides like azoxystrobin at first sign of pustules. Plant resistant hybrids in future seasons.',
            image_uri: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
        },
    ],
    'cropguard.farmer2@gmail.com': [
        {
            disease: 'Apple - Apple Scab',
            confidence: 0.87,
            recommendation: 'Remove fallen leaves to reduce spore sources. Apply fungicide sprays during spring. Prune trees for better air circulation.',
            image_uri: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400',
        },
        {
            disease: 'Grape - Healthy',
            confidence: 0.95,
            recommendation: 'The plant appears to be healthy. No treatment is necessary. Continue regular monitoring and care.',
            image_uri: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?w=400',
        },
    ],
};

async function createUser(email, password, name) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            email,
            password,
            data: { name },
        }),
    });

    const data = await res.json();
    const userId = data.id || data.user?.id;

    if (userId) {
        console.log(` ${email} → id: ${userId}`);
        return userId;
    } else {
        console.log(` ${email}: ${data.msg || data.message || JSON.stringify(data)}`);
        return null;
    }
}

async function loginUser(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    return {
        userId: data.user?.id || null,
        accessToken: data.access_token || null,
    };
}

async function insertScan(accessToken, userId, scan) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/scan_history`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
            user_id: userId,
            image_uri: scan.image_uri,
            disease: scan.disease,
            confidence: scan.confidence,
            recommendation: scan.recommendation,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        console.log(`Failed to insert scan: ${err}`);
        return false;
    }
    return true;
}

async function main() {
    console.log('CropGuard Database Setup');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Supabase: ${SUPABASE_URL}`);
    console.log('');


    console.log('👤 Step 1: Creating default users...');
    const userMap = {};

    for (const u of DEFAULT_USERS) {
        const id = await createUser(u.email, u.password, u.name);
        if (id) userMap[u.email] = id;
    }
    console.log('');


    console.log('Step 2: Seeding sample scan history...');

    for (const [email, scans] of Object.entries(SAMPLE_SCANS)) {
        const user = DEFAULT_USERS.find(u => u.email === email);
        if (!user) continue;

        const { userId, accessToken } = await loginUser(email, user.password);
        if (!userId || !accessToken) {
            console.log(`Cannot login as ${email}, skipping scans`);
            continue;
        }

        console.log(`  Seeding ${scans.length} scans for ${email}...`);
        for (const scan of scans) {
            await insertScan(accessToken, userId, scan);
        }
        console.log(`Done`);
    }

    console.log('');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Setup complete!');
    console.log('');
    console.log('Default test accounts:');
    console.log('cropguard.farmer1@gmail.com / farmer123!');
    console.log('cropguard.farmer2@gmail.com / farmer123!');
    console.log('cropguard.admin@gmail.com   / admin12345');
    console.log('');
    console.log('Start the app: npx expo start --web');
}

main().catch(console.error);
