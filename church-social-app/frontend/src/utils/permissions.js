// Role-based permission checks
// Pastors have full admin access

export const canCreateEvent = (user) => {
  if (!user) return false;
  const allowedRoles = ['pastor', 'sound_engineer'];
  return allowedRoles.includes(user.role);
};

export const canCreateSermon = (user) => {
  if (!user) return false;
  const allowedRoles = ['pastor', 'sound_engineer'];
  return allowedRoles.includes(user.role);
};

export const canCreateGroup = (user) => {
  if (!user) return false;
  return user.role === 'pastor';
};

export const canCreatePost = (user) => {
  // All authenticated members can create posts
  return !!user;
};

export const canDeletePost = (user, post) => {
  if (!user) return false;
  // Pastors can delete any post
  if (user.role === 'pastor') return true;
  // Users can delete their own posts
  return post?.author?._id === user.id || post?.author === user.id;
};

export const canCreatePrayer = (user) => {
  // All members can create prayer requests
  return !!user;
};

export const isAdmin = (user) => {
  // Pastors are admins now
  return user?.role === 'pastor';
};

export const isPastor = (user) => {
  return user?.role === 'pastor';
};

export const isSoundEngineer = (user) => {
  return user?.role === 'sound_engineer';
};

export const isStaff = (user) => {
  if (!user) return false;
  return ['pastor', 'sound_engineer'].includes(user.role);
};
