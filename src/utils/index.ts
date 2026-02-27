/** Base path for the app (e.g. '' or '/constructflow'). Used so links work when app is served from a subpath. */
function getBasePath(): string {
    const base = (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL)
        ? String(import.meta.env.BASE_URL).replace(/\/$/, '')
        : '';
    return base || '';
}

export function createPageUrl(pageName: string): string {
    const base = getBasePath();
    const path = '/' + pageName.replace(/ /g, '-');
    return base ? base + path : path;
}