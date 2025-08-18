import { useUser } from "@clerk/nextjs";

export default function Userinfo() {
  const { user } = useUser();

  if (!user) return <div>Loading...</div>;
  return (
    <>
      <p>Email: {user.primaryEmailAddress?.emailAddress}</p>
      <p>Username: {user.username}</p>
      <img src={user.imageUrl} alt="Profile" />
    </>
  );
}
