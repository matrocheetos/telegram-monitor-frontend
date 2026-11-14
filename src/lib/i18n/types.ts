export type SupportedLocale = 'pt-BR' | 'en-US'

export interface I18nDictionary {
  common: {
    appName: string
    initialSetupBrand: string
    userControlCenter: string
    adminControlCenter: string
    connectedAs: string
    roleUser: string
    roleAdmin: string
    logout: string
    copied: string
    copyUrl: string
    copyTopic: string
    copyCoupon: string
    topicCopied: string
    openStore: string
    remove: string
    save: string
    saveChanges: string
    cancel: string
    action: string
    actionsAdmin: string
    date: string
    store: string
    channel: string
    channelTelegramGroup: string
    chatIdUsername: string
    active: string
    inactive: string
    administrator: string
    user: string
    badgeAdmin: string
    badgeUser: string
    protected: string
    close: string
  }
  setup: {
    title: string
    username: string
    usernamePlaceholder: string
    password: string
    confirmPassword: string
    submit: string
    passwordMismatch: string
    usernameRequired: string
    passwordMinLength: string
  }
  login: {
    title: string
    username: string
    password: string
    submit: string
    invalidCredentials: string
  }
  nav: {
    telegramConnection: string
    monitoredChannels: string
    userManagement: string
    myInterests: string
    offersFound: string
  }
  navShort: {
    telegram: string
    channels: string
    users: string
    terms: string
    myTerms: string
    offers: string
    offersFound: string
  }
  dashboard: {
    title: string
    notificationChannel: string
    couponsChannel: string
    addInterestTitle: string
    termPlaceholder: string
    maxPricePlaceholder: string
    addInterestButton: string
    monitoredTermsTitle: (count: number) => string
    termHeader: string
    rulesHeader: string
    targetPriceHeader: string
    lastAlertHeader: string
    actionHeader: string
    noLimit: string
    upTo: (price: string) => string
    exclusionLabel: string
    freeTokensSynonyms: string
    freeTokensExclusion: string
    freeTokensAccentCase: string
    freeTokensFuzzy: string
  }
  telegram: {
    title: string
    activeSession: string
    inactiveSession: string
    connectedAccount: (masked: string) => string
    noAccountConnected: string
    pendingAuth: string
    syncedChannels: (count: number) => string
    selectChannels: string
    disconnect: string
    disconnectConfirm: string
    step1: string
    step1Title: string
    apiId: string
    apiIdPlaceholder: string
    apiHash: string
    apiHashPlaceholder: string
    phone: string
    phonePlaceholder: string
    sendOtp: string
    step2: string
    step2Title: string
    code: string
    codeDisabledPlaceholder: string
    twoFactor: string
    twoFactorOptional: string
    securityNoticeTitle: string
    securityNoticeDesc: string
    connectAccount: string
  }
  channels: {
    title: string
    kpiAccount: string
    kpiCoupons: string
    kpiCouponsDesc: (count: number) => string
    kpiProducts: string
    kpiProductsDesc: (count: number) => string
    searchPlaceholder: string
    syncButton: string
    saveButton: string
    colProducts: string
    colCoupons: string
    monitorProducts: string
    ignoreProducts: string
    monitorCoupons: string
    ignoreCoupons: string
  }
  users: {
    title: string
    registerTitle: string
    username: string
    usernamePlaceholder: string
    initialPassword: string
    role: string
    createUser: string
    registeredUsersTitle: (count: number) => string
    colUser: string
    colRole: string
    colPublicChannel: string
    colActiveTerms: string
    termsActiveCount: (count: number) => string
    viewTermsAria: (username: string, count: number) => string
    activeTermsModalBadge: string
    activeTermsModalTitle: (username: string, count: number) => string
    activeTermsEmpty: string
    colCreatedAt: string
    createdAtLabel: (date: string) => string
    resetPassword: string
    deleteUser: string
    deleteUserConfirm: (username: string) => string
  }
  offers: {
    title: string
    tabProducts: (count: number) => string
    tabCoupons: (count: number) => string
    searchPlaceholder: string
    productsTitle: string
    couponsTitle: string
    colOffer: string
    colTerm: string
    colPrice: string
    colCouponCode: string
    colRuleMessage: string
    openLink: string
  }
  emptyState: {
    interests: string
    channels: string
    products: string
    coupons: string
    interestsTitle: string
    channelsTitle: string
    productsTitle: string
    couponsTitle: string
    colProductsShort: string
    colCouponsShort: string
  }
  apiErrors: {
    networkError: string
    badGateway: string
    unauthorized: string
    forbidden: string
    notFound: string
    conflict: string
    unprocessable: string
    genericError: string
  }
  aria: {
    ntfyInfoButton: string
    mobileMenuButton: string
  }
  ntfyModal: {
    badgeUser: (username: string) => string
    badgeCoupons: string
    titleProduct: string
    titleCoupon: string
    aboutProductTitle: (topic: string) => string
    aboutProductDesc: string
    aboutCouponTitle: (topic: string) => string
    aboutCouponDesc: string
    step1Title: string
    androidBtn: string
    androidUrl: string
    iosBtn: string
    iosUrl: string
    step2Title: string
    step2Item1: string
    step2Item2Product: (topic: string) => string
    step2Item2Coupon: (topic: string) => string
    step2Item3: (url: string) => string
    step2Item4Product: (couponTopic: string) => string
    step2Item4Coupon: (userTopic: string) => string
    topicLabel: (topic: string) => string
    alsoAvailableCoupon: (topic: string) => string
    alsoAvailableProduct: (topic: string) => string
    doneBtn: string
  }
}
