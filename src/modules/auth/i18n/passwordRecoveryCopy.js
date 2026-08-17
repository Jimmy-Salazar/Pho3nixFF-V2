const COPY = {
  es: {
    forgotPassword: "¿Olvidaste tu contraseña?",
    recoverEyebrow: "Seguridad PHO3NIX",
    recoverTitle: "Recuperar contraseña",
    recoverDescription:
      "Ingresa el correo asociado a tu cuenta. Te enviaremos un enlace para crear una nueva contraseña.",
    email: "Correo electrónico",
    emailPlaceholder: "tu@email.com",
    sendRecovery: "Enviar enlace",
    sendingRecovery: "Enviando...",
    recoverySentTitle: "Revisa tu correo",
    recoverySent:
      "Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer tu contraseña.",
    recoveryError:
      "No se pudo solicitar la recuperación. Inténtalo nuevamente.",
    backToLogin: "Volver a iniciar sesión",
    resetEyebrow: "Seguridad PHO3NIX",
    resetTitle: "Restablecer contraseña",
    resetDescription:
      "Ingresa y confirma tu nueva contraseña.",
    newPassword: "Nueva contraseña",
    confirmPassword: "Confirmar contraseña",
    newPasswordPlaceholder: "Nueva contraseña",
    confirmPasswordPlaceholder: "Repite la contraseña",
    updatePassword: "Guardar nueva contraseña",
    updatingPassword: "Guardando...",
    passwordMismatch: "Las contraseñas no coinciden.",
    passwordRequired: "Ingresa una nueva contraseña.",
    invalidRecovery:
      "El enlace de recuperación no es válido, expiró o ya fue utilizado.",
    requestAnotherLink: "Solicitar un nuevo enlace",
    passwordUpdatedTitle: "Contraseña actualizada",
    passwordUpdated:
      "Tu contraseña fue actualizada correctamente. Ya puedes iniciar sesión.",
    updateError:
      "No se pudo actualizar la contraseña. Solicita un nuevo enlace e inténtalo nuevamente.",
  },

  en: {
    forgotPassword: "Forgot your password?",
    recoverEyebrow: "PHO3NIX Security",
    recoverTitle: "Recover password",
    recoverDescription:
      "Enter the email associated with your account. We will send you a link to create a new password.",
    email: "Email",
    emailPlaceholder: "you@email.com",
    sendRecovery: "Send recovery link",
    sendingRecovery: "Sending...",
    recoverySentTitle: "Check your email",
    recoverySent:
      "If an account exists for that email, you will receive a link to reset your password.",
    recoveryError:
      "The recovery request could not be completed. Please try again.",
    backToLogin: "Back to sign in",
    resetEyebrow: "PHO3NIX Security",
    resetTitle: "Reset password",
    resetDescription:
      "Enter and confirm your new password.",
    newPassword: "New password",
    confirmPassword: "Confirm password",
    newPasswordPlaceholder: "New password",
    confirmPasswordPlaceholder: "Repeat password",
    updatePassword: "Save new password",
    updatingPassword: "Saving...",
    passwordMismatch: "Passwords do not match.",
    passwordRequired: "Enter a new password.",
    invalidRecovery:
      "The recovery link is invalid, expired, or has already been used.",
    requestAnotherLink: "Request another link",
    passwordUpdatedTitle: "Password updated",
    passwordUpdated:
      "Your password was updated successfully. You can now sign in.",
    updateError:
      "The password could not be updated. Request a new link and try again.",
  },
}

export function getPasswordRecoveryCopy(locale) {
  return COPY[locale] || COPY.es
}