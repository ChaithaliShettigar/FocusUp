export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return re.test(email)
}

export const validatePassword = (password) => {
  // Strict validation: 8+ chars, 1 uppercase, 1 number, 1 special char
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return password && passwordRegex.test(password)
}

export const validateName = (name) => {
  return name && name.trim().length > 0
}

export const validateTargetMinutes = (minutes) => {
  return minutes && !isNaN(minutes) && minutes > 0
}
