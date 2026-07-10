import fs from 'fs';
import path from 'path';

const replaceInFile = (filePath, searchValue, replaceValue) => {
  const fullPath = path.resolve(filePath);
  if (fs.existsSync(fullPath)) {
    let content = fs.readFileSync(fullPath, 'utf8');
    content = content.replace(searchValue, replaceValue);
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
};

// 1. RoomManagement.jsx
replaceInFile('../frontend/src/pages/RoomManagement.jsx', 
  /import { DoorClosed, UserPlus, BedDouble } from 'lucide-react';/, 
  "import { DoorClosed, BedDouble } from 'lucide-react';"
);

// 2. ComplaintManagement.jsx
replaceInFile('../frontend/src/pages/ComplaintManagement.jsx',
  /} catch \(error\) {\n\s+toast\.error\('Failed to update complaint'\);/g,
  "} catch (error) {\n      toast.error(error.response?.data?.message || 'Failed to update complaint');"
);

// 3. StudentProfile.jsx
replaceInFile('../frontend/src/pages/StudentProfile.jsx',
  /import React, { useState, useEffect, useContext } from 'react';/,
  "import React, { useState, useEffect } from 'react';"
);
replaceInFile('../frontend/src/pages/StudentProfile.jsx',
  /import { AuthContext } from '\.\.\/contexts\/AuthContext';\n/,
  ""
);

// 4. AuthContext.jsx
replaceInFile('../frontend/src/contexts/AuthContext.jsx',
  /export const AuthContext = createContext\(\);/,
  "// eslint-disable-next-line react-refresh/only-export-components\nexport const AuthContext = createContext();"
);

console.log('Lint fixing round 2 completed.');
