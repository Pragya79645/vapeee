import { useEffect } from 'react';

const VersionCheck = () => {
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const checkVersion = async () => {
            try {
                const response = await fetch(`/meta.json?t=${Date.now()}`);
                if (!response.ok) return;

                const data = await response.json();
                const currentVersion = import.meta.env.VITE_APP_VERSION;

                if (data.version && currentVersion && data.version !== currentVersion) {
                    console.log('New version available. Refreshing page...');
                    window.location.reload(true);
                }
            } catch (error) {
                // Ignore fetch errors during navigation or offline
            }
        };

        // Check version on mount
        checkVersion();

        // Check version every 5 minutes
        const interval = setInterval(checkVersion, 5 * 60 * 1000);

        // Check version when window regains focus
        const handleFocus = () => checkVersion();
        window.addEventListener('focus', handleFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    return null;
};

export default VersionCheck;
