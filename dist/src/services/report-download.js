import axios from 'axios';
// Analytics segment URLs are pre-signed: never forward App Store credentials.
export async function downloadReportSegment(url) {
    const destination = new URL(url);
    if (destination.protocol !== 'https:' || destination.username || destination.password) {
        throw new Error('Report downloads require an HTTPS URL without credentials');
    }
    return axios.get(url, {
        // Do not let a signed URL redirect to a different destination.
        maxRedirects: 0,
        headers: { Authorization: false },
        auth: undefined,
    });
}
