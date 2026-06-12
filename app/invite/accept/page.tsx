import { InviteAcceptPanel } from "@/components/auth/invite-accept-panel";

type InviteAcceptPageProps = {
  searchParams?: Promise<{ token?: string }>;
};

export default async function InviteAcceptPage({ searchParams }: InviteAcceptPageProps) {
  const params = searchParams ? await searchParams : undefined;
  const token = params?.token?.trim() ?? "";

  return <InviteAcceptPanel token={token} />;
}
