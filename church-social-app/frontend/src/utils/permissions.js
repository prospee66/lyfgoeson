// Role-based permission checks

export const canCreateEvent = (user) => {
  if (!user) return false;
  const allowedRoles = ['admin', 'pastor', 'sound_engineer'];
  return allowedRoles.includes(user.role);
};

export const canCreateSermon = (user) => {
  if (!user) return false;
  const allowedRoles = ['admin', 'pastor', 'sound_engineer'];
  return allowedRoles.includes(user.role);
};

export const canCreateGroup = (user) => {
  if (!user) return false;
  const allowedRoles = ['admin', 'pastor'];
  return allowedRoles.includes(user.role);
};

export const canCreatePost = (user) => {
  // Only staff members can create posts
  if (!user) return false;
  const allowedRoles = ['admin', 'pastor', 'sound_engineer'];
  return allowedRoles.includes(user.role);
};

export const canCreatePrayer = (user) => {
  // All members can create prayer requests
  return !!user;
};

export const isAdmin = (user) => {
  return user?.role === 'admin';
};

export const isPastor = (user) => {
  return user?.role === 'pastor';
};

export const isSoundEngineer = (user) => {
  return user?.role === 'sound_engineer';
};

export const isStaff = (user) => {
  if (!user) return false;
  return ['admin', 'pastor', 'sound_engineer'].includes(user.role);
};
