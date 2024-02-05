"use client";
import { useDropzone } from "react-dropzone";
import { useCallback } from "react";
import { Button } from "@nextui-org/react";
import { Send, Upload } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const Dropzone = ({
  file,
  setFile,
  title,
}: {
  file: File | null;
  setFile: React.Dispatch<React.SetStateAction<File | null>>;
  title: string;
}) => {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      if (!acceptedFiles[0]) return;
      setFile(acceptedFiles[0]);
    },
    [setFile],
  );

  const {
    getRootProps,
    getInputProps,
    open: openRas,
  } = useDropzone({
    onDrop,
    accept: {
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    maxFiles: 1,
    noClick: true,
    noKeyboard: true,
  });

  const trimTitle = (title: string) => {
    if (title.length > 15) {
      return `"${title.slice(0, 15)}..."`;
    }
    return `"${title}"`;
  };

  return (
    <div
      {...getRootProps()}
      className="flex h-[250px] w-[350px] flex-col items-stretch rounded-sm border border-dashed"
    >
      <div className="flex h-full flex-col justify-center gap-2">
        <input {...getInputProps()} />
        <span className="flex flex-row justify-center">
          <Upload />
        </span>
        <span className="text-center text-lg">Drag and drop your file here</span>
        <span className="text-center text-primary/90">or</span>
        <div className="flex flex-row justify-center">
          <Button type="button" onClick={openRas}>
            Browse files
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Dropzone;
