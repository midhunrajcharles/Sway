"use client";

import { useEffect } from "react";
import { RequestedPath } from "@/components/RequestedPath";
import { STATUS_COPY, StatusPage } from "@/components/StatusPage";
import { Text } from "@/components/Text";
import { WipeButton } from "@/components/WipeButton";

export default function Error({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const copy = STATUS_COPY.error;
  return (
    <StatusPage
      copy={copy}
      meta={
        error.digest ? (
          <Text as="span" variant="label-medium" color="foreground-50">
            {`${STATUS_COPY.reference} ${error.digest}`}
          </Text>
        ) : (
          <RequestedPath />
        )
      }
      action={
        <WipeButton onClick={retry} arrow="right">
          {copy.cta}
        </WipeButton>
      }
    />
  );
}
