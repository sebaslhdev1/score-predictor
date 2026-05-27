export type Locale = "en" | "es"

export interface Translation {
  auth: {
    signIn: string
    email: string
    emailPlaceholder: string
    sendCode: string
    sendingCode: string
    name: string
    namePlaceholder: string
    newUserTitle: string
    newUserDesc: string
    createAccount: string
    creatingAccount: string
    createAccountError: string
    verify: string
    verifying: string
    otpHint: string
    checkEmail: string
    codeSentTo: string
    back: string
    didntReceive: string
    resend: string
    subtitle: string
    signInError: string
    verifyError: string
  }
  nav: {
    appTitle: string
    appSubtitle: string
    logOut: string
    language: string
    greeting: string
    predictions: string
    scoreboard: string
    participants: string
  }
  dashboard: {
    title: string
    noMatches: string
    upcomingMatches: string
    myPredictions: string
  }
  predictions: {
    title: string
    subtitle: string
    tie: string
    noMatches: string
    loadError: string
    submitError: string
    submit: string
    submitting: string
    submitSuccess: string
    submitSuccessDesc: string
    predictionRemoved: string
    predictionBlocked: string
    today: string
    closesIn: string
    progressLabel: string
    clearAll: string
    discard: string
    resetAll: string
    whoWins: string
    closedMatches: string
    noClosedMatches: string
    closesOn: string
    championTitle: string
    championSubtitle: string
    championPlaceholder: string
    championSubmit: string
    championSubmitting: string
    championSuccess: string
    championSaved: string
    championChange: string
    championNoResults: string
  }
  scoreboard: {
    title: string
    subtitle: string
    rank: string
    player: string
    points: string
    correct: string
    noResults: string
    loadError: string
    wipBadge: string
    wipDesc: string
    you: string
    refresh: string
    refreshing: string
    updatedAt: string
  }
  participants: {
    title: string
    subtitle: string
    predictions: string
    noParticipants: string
    loadError: string
    wipBadge: string
    wipDesc: string
  }
  tournaments: {
    title: string
    subtitle: string
    owner: string
    noTournaments: string
    loadError: string
  }
  errors: {
    sessionExpiredTitle: string
    sessionExpiredDesc: string
    sessionExpiredButton: string
  }
}
