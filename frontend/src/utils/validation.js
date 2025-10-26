export const validatePostLimit = (value) => {
  if (!value || value < 1) {
    return 'Лимит должен быть больше 0';
  }

  if (value > 1000) {
    return 'Лимит не должен превышать 1000';
  }

  if (!Number.isInteger(value)) {
    return 'Лимит должен быть целым числом';
  }

  return '';
};
