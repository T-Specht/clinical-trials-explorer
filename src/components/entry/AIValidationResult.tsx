import { CheckCircleIcon, SparklesIcon, XCircleIcon } from "lucide-react";
import { AIConfiguration } from "./renderEntryField";
import { Code, Title } from "@mantine/core";

export const AIValidationResult = (props: {
  data: NonNullable<AIConfiguration["checkModeConfig"]["aiData"]>;
  onChange: (e: string) => void;
}) => {
  const { critique, generalAcceptance, suggestions } = props.data;

  return (
    <div className="text-sm mb-4 bg-secondary rounded-md py-4 px-2">
      {generalAcceptance ? (
        <div className="flex space-x-2 items-center text-green">
          <CheckCircleIcon
            className="min-w-5 p-1"
            strokeWidth={3}
            size="25px"
          ></CheckCircleIcon>
          <Title order={4}>Check passed</Title>
        </div>
      ) : (
        <div className="flex space-x-2 items-center  text-red">
          <XCircleIcon
            strokeWidth={3}
            className="min-w-5 p-1"
            size="25px"
          ></XCircleIcon>
          <Title order={4}>
            Check <b>NOT</b> passed
          </Title>
        </div>
      )}
      <ul className="list-disc pl-4 opacity-60 mt-2">
        {critique.map((p, i) => (
          <li key={i}>{p}</li>
        ))}
      </ul>
      {!generalAcceptance && (
        <div className="mt-2 opacity-60">
          <div className="flex items-center space-x-2 mb-2 font-bold ">
            <div>
              <SparklesIcon size={15}></SparklesIcon>
            </div>
            <div>Suggestions</div>
          </div>
          <div>
            {suggestions.map((s, i) => (
              <span key={i}>
                {i != 0 && ", "}
                <Code
                  className="cursor-pointer"
                  onClick={() => {
                    props.onChange(s);
                  }}
                >
                  {s}
                </Code>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
