export const generateOrgCode = (name) => {
  // Extract initials
  let initials = '';
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    // Single word: Take up to first 4 letters
    initials = words[0].replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4);
  } else {
    // Multiple words: Take first letter of each word
    initials = words
      .map(w => w.replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase())
      .join('')
      .substring(0, 4);
  }
  
  // Fallback if name had no alphabets
  if (!initials) initials = 'PG';

  // Generate 4-character random alphanumeric suffix (excluding O,0,I,1 for readability)
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return `${initials}${suffix}`;
};
