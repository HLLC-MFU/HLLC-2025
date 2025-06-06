export const usePasswordValidation = () => {
  const validateStudentId = (id: string) => {
    const studentIdRegex = /^6\d{7}$/;
    return studentIdRegex.test(id);
  };

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/;
    return passwordRegex.test(password);
  };

  return {
    validateStudentId,
    validatePassword,
  };
}; 