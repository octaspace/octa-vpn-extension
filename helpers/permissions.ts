import { IS_FIREFOX } from "./config"
import { ext } from "./platform"

const siteAccess = { origins: ["<all_urls>"] }
export const notificationAccess = { permissions: ["notifications"] }

export const hasSiteAccess = () =>
  IS_FIREFOX || ext.permissions.contains(siteAccess)

export const requestSiteAccess = () =>
  IS_FIREFOX || ext.permissions.request(siteAccess)
