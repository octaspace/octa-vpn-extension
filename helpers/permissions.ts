import { ext } from "./platform"

// Every site: the node's proxy login is answered only for requests the
// extension may see. Asked for on the first connect, not at install.
const siteAccess = { origins: ["<all_urls>"] }
export const notificationAccess = { permissions: ["notifications"] }

export const hasSiteAccess = () => ext.permissions.contains(siteAccess)

export const requestSiteAccess = () => ext.permissions.request(siteAccess)
