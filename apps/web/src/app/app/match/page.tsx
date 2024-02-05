"use client";

import { useCallback, useEffect, useState } from "react";
import { Button, Textarea } from "@nextui-org/react";
import { api, apiVanilla } from "@/lib/trpc/client";
import { useLocalStorage } from "@uidotdev/usehooks";
import { RouterOutputs } from "@/lib/trpc/client";
import Matcher from "@/components/Matcher";

type SessionType = RouterOutputs["uploadRouter"]["getSkillsFromExcerpt"]["record"];

export default function Page() {
  const [value, setValue] = useState("");

  const [sessionData, saveSessionData] = useLocalStorage<SessionType | null>(
    "matchSessionData",
    null,
  );

  const onSubmit = () => {
    apiVanilla.uploadRouter.getSkillsFromExcerpt.query({ text: value }).then((res) => {
      saveSessionData(res.record);
    });
  };

  const reset = useCallback(() => {
    saveSessionData(null);
  }, [saveSessionData]);

  if (sessionData) {
    return (
      <Matcher skills={sessionData.skills} categories={sessionData.categories} reset={reset} />
    );
  }

  return (
    <div className="flex w-full flex-col gap-4 px-36 py-8">
      <h4 className="text-xl font-semibold">
        Paste the entire text of a CV here in order to get started.
      </h4>
      <span className="font-semibold">You do not have to worry about formatting.</span>
      <Textarea
        // label="Extract Skills from"
        labelPlacement="outside"
        placeholder="..."
        value={value}
        onValueChange={setValue}
      />
      {/* <p className="text-small text-default-500">Textarea value: {value}</p> */}
      <Button onPress={onSubmit} color="primary">
        Let's get this bread!!!
      </Button>
    </div>
  );
}
