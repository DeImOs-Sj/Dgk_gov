import { ScrollView } from "react-native";

import { FileDefinition } from "@/shared/files";

import AttachmentChip from "./AttachmentChip";

export default function ChatInputFilesSelected({
  selectedFiles,
  onRemove,
  authToken,
}: {
  selectedFiles: FileDefinition[];
  onRemove: (file: FileDefinition) => void;
  authToken?: string;
}) {
  return (
    <ScrollView
      horizontal
      style={{
        position: "absolute",
        top: -80,
        left: 0,
        height: 72,
        maxWidth: "100%",
      }}
    >
      {selectedFiles.map((file, i) => (
        <AttachmentChip
          key={file.id}
          file={file}
          onRemove={() => onRemove(file)}
          authToken={authToken}
        />
      ))}
    </ScrollView>
  );
}
