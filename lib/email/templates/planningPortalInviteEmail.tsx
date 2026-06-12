import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type PlanningPortalInviteEmailProps = {
  recipientName?: string | null;
  eventTitle: string;
  inviteUrl: string;
  expiresAtLabel: string;
};

export function PlanningPortalInviteEmail({
  recipientName,
  eventTitle,
  inviteUrl,
  expiresAtLabel,
}: PlanningPortalInviteEmailProps) {
  const greeting = recipientName?.trim() ? `Hi ${recipientName.trim()},` : "Hello,";

  return (
    <Html>
      <Head />
      <Preview>
        You&apos;re invited to access the Cutmaster Music Planning Portal for {eventTitle}
      </Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Text style={brandStyle}>Cutmaster Music</Text>
          <Heading style={headingStyle}>Planning Portal Access</Heading>
          <Text style={textStyle}>{greeting}</Text>
          <Text style={textStyle}>
            You&apos;ve been invited to access the planning portal for:
          </Text>
          <Text style={eventTitleStyle}>{eventTitle}</Text>
          <Text style={textStyle}>
            Use the portal to review event details, share planning input, and collaborate with
            your event team.
          </Text>
          <Section style={buttonSectionStyle}>
            <Button href={inviteUrl} style={buttonStyle}>
              Open Planning Portal
            </Button>
          </Section>
          <Text style={textStyle}>
            This link expires on <strong>{expiresAtLabel}</strong>.
          </Text>
          <Hr style={hrStyle} />
          <Text style={fallbackLabelStyle}>
            If the button doesn&apos;t work, copy and paste this link into your browser:
          </Text>
          <Link href={inviteUrl} style={linkStyle}>
            {inviteUrl}
          </Link>
          <Hr style={hrStyle} />
          <Text style={footerStyle}>— Cutmaster Music</Text>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  backgroundColor: "#f5f5f4",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
  margin: "0",
  padding: "24px 0",
} as const;

const containerStyle = {
  backgroundColor: "#ffffff",
  border: "1px solid #e7e5e4",
  borderRadius: "12px",
  margin: "0 auto",
  maxWidth: "560px",
  padding: "32px 28px",
} as const;

const brandStyle = {
  color: "#0c0a09",
  fontSize: "12px",
  fontWeight: "700",
  letterSpacing: "0.08em",
  margin: "0 0 16px",
  textTransform: "uppercase" as const,
};

const headingStyle = {
  color: "#0c0a09",
  fontSize: "24px",
  fontWeight: "700",
  lineHeight: "1.3",
  margin: "0 0 20px",
};

const textStyle = {
  color: "#44403c",
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

const eventTitleStyle = {
  color: "#0c0a09",
  fontSize: "18px",
  fontWeight: "600",
  lineHeight: "1.4",
  margin: "0 0 16px",
};

const buttonSectionStyle = {
  margin: "24px 0",
  textAlign: "center" as const,
};

const buttonStyle = {
  backgroundColor: "#00D4FF",
  borderRadius: "8px",
  color: "#000000",
  display: "inline-block",
  fontSize: "15px",
  fontWeight: "700",
  padding: "12px 24px",
  textDecoration: "none",
};

const hrStyle = {
  borderColor: "#e7e5e4",
  margin: "24px 0",
};

const fallbackLabelStyle = {
  color: "#78716c",
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 8px",
};

const linkStyle = {
  color: "#0369a1",
  fontSize: "13px",
  lineHeight: "1.5",
  wordBreak: "break-all" as const,
};

const footerStyle = {
  color: "#78716c",
  fontSize: "13px",
  margin: "0",
};
