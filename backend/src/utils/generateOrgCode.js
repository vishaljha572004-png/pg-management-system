export const generateOrgCode = (name) => {
  
  let initials = '';
  const words = name.trim().split(/\s+/);
  
  if (words.length === 1) {
    
    initials = words[0].replace(/[^a-zA-Z]/g, '').toUpperCase().substring(0, 4);
  } else {
    
    initials = words
      .map(w => w.replace(/[^a-zA-Z]/g, '').charAt(0).toUpperCase())
      .join('')
      .substring(0, 4);
  }
  
  
  if (!initials) initials = 'PG';

  
  const charset = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let suffix = '';
  for (let i = 0; i < 4; i++) {
    suffix += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return `${initials}${suffix}`;
};
