export const formatAddress = (addr) => {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

export const formatEth = (wei) => {
  return parseFloat(wei).toFixed(4);
};

export const getTimeRemaining = (endTime) => {
  const total = endTime - Date.now();
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };

  const seconds = Math.floor((total / 1000) % 60);
  const minutes = Math.floor((total / 1000 / 60) % 60);
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const days = Math.floor(total / (1000 * 60 * 60 * 24));

  return { days, hours, minutes, seconds, expired: false };
};

export const randomGradient = () => {
  const gradients = [
    "linear-gradient(135deg, #a855f7, #06b6d4)",
    "linear-gradient(135deg, #ec4899, #a855f7)",
    "linear-gradient(135deg, #06b6d4, #22c55e)",
    "linear-gradient(135deg, #f97316, #ec4899)",
    "linear-gradient(135deg, #6366f1, #06b6d4)",
  ];
  return gradients[Math.floor(Math.random() * gradients.length)];
};