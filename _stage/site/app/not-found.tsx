import { RequestedPath } from "@/components/RequestedPath";
import { STATUS_COPY, StatusPage } from "@/components/StatusPage";
import { WipeButton } from "@/components/WipeButton";
import { routes } from "@/lib/routes";

export default function NotFound() {
  const copy = STATUS_COPY.notFound;
  return (
    <StatusPage
      copy={copy}
      meta={<RequestedPath />}
      action={
        <WipeButton href={routes.home} arrow="right">
          {copy.cta}
        </WipeButton>
      }
    />
  );
}
