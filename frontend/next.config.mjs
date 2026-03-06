/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: "/interview-practice",
        destination: "/resume-analyzer",
        permanent: true,
      },
      {
        source: "/question-bank",
        destination: "/study-quiz/practice",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
