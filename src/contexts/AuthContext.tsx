// Updated fetchOrCreateProfile function with failsafe for account creation

async function fetchOrCreateProfile() {
    try {
        // Your existing code to fetch or create profile
    } catch (error) {
        console.error('Profile creation failed:', error);
        // Critical check to sign out the user
        signOutUser();
    }
}

function signOutUser() {
    // Implement sign-out logic here
    console.log('User has been signed out due to profile creation failure.');
}