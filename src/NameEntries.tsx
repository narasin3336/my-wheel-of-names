import { useState, useEffect, useRef } from "react";
import { Box, Button, Flex } from "@chakra-ui/react";
import {
  ArrowUp,
  ArrowDown,
  Shuffle,
  Trash,
  RefreshCcw,
  Upload,
} from "lucide-react";
import * as XLSX from "xlsx";

const SortAZIcon = (props: any) => <Box as={ArrowUp} {...props} />;
const SortZAIcon = (props: any) => <Box as={ArrowDown} {...props} />;
const ShuffleIcon = (props: any) => <Box as={Shuffle} {...props} />;
const DeleteIcon = (props: any) => <Box as={Trash} {...props} />;
const RandomIcon = (props: any) => <Box as={RefreshCcw} {...props} />;
const UploadIcon = (props: any) => <Box as={Upload} {...props} />;

interface NameEntriesProps {
  names: string[];
  setNames: (names: string[]) => void;
  headerText: string;
  setHeaderText: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pickRandomHeader: () => void;
}

export const EditableHeader: React.FC<{
  headerText: string;
  setHeaderText: (e: React.ChangeEvent<HTMLInputElement>) => void;
  pickRandomHeader: () => void;
}> = ({ headerText, setHeaderText, pickRandomHeader }) => {
  return (
    <Box textAlign="center" mb={6}>
      <Flex align="center" justify="start" gap={2}>
        <input
          type="text"
          value={headerText}
          onChange={setHeaderText}
          style={{
            padding: "8px",
            backgroundColor: "#F8F7F3",
            border: "1px solid #CCCCCC",
            borderRadius: "4px",
            fontFamily: "Arial, sans-serif",
            fontSize: "14px",
            width: "80%",
          }}
          placeholder="Edit header text"
        />
        <Button
          bg="#EAEAEA"
          color="#333333"
          borderRadius="4px"
          _hover={{ bg: "#CCCCCC" }}
          onClick={pickRandomHeader}
        >
          <RandomIcon color="#888888" />
        </Button>
      </Flex>
    </Box>
  );
};

export const NameEntries: React.FC<NameEntriesProps> = ({
  names,
  setNames,
  headerText,
  setHeaderText,
  pickRandomHeader,
}) => {
  const defaultNames = [
    "Alice",
    "Bob",
    "Charlie",
    "David",
    "Emma",
    "Frank",
    "Grace",
    "Henry",
  ];

  const [isAscending, setIsAscending] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const storedNames = localStorage.getItem("wheel-names");
    if (storedNames) {
      try {
        const parsedNames = JSON.parse(storedNames);
        if (Array.isArray(parsedNames) && parsedNames.length > 0) {
          setNames(parsedNames);

          // Populate the textarea with stored names
          const textarea = document.querySelector("textarea");
          if (textarea) {
            textarea.value = parsedNames.join("\n");
          }
        } else {
          updateNames(defaultNames); // Initialize with default names if stored data is invalid
        }
      } catch (error) {
        console.error("Error parsing names from localStorage:", error);
        setNames(defaultNames); // Fallback to default names on error
      }
    } else {
      updateNames(defaultNames); // Initialize with default names if no data is stored
    }
  }, []);

  const updateNames = (updatedNames: string[]) => {
    setNames(updatedNames);
    localStorage.setItem("wheel-names", JSON.stringify(updatedNames));

    // Update the textarea content
    const textarea = document.querySelector("textarea");
    if (textarea) {
      textarea.value = updatedNames.join("\n");
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    const updatedNames = text
      .split("\n")
      .map((name) => name.trim())
      .filter((name) => name);
    setNames(updatedNames);
    localStorage.setItem("wheel-names", JSON.stringify(updatedNames));
  };

  const normalizeImportedNames = (raw: unknown[]): string[] => {
    const seen = new Set<string>();
    const result: string[] = [];

    for (const value of raw) {
      const name = String(value ?? "").trim();
      if (!name) continue;
      if (name.toLowerCase() === "name") continue;
      if (seen.has(name)) continue;
      seen.add(name);
      result.push(name);
    }

    return result;
  };

  const parseCsvLikeTextToNames = (text: string): string[] => {
    const parts = text
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n")
      .split(/[\n,;\t]+/g)
      .map((s) => s.trim())
      .filter(Boolean);

    return normalizeImportedNames(parts);
  };

  const parseExcelToNames = async (file: File): Promise<string[]> => {
    const buf = await file.arrayBuffer();
    const workbook = XLSX.read(buf, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[firstSheetName];
    if (!sheet) return [];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][];
    const firstColumn = rows.map((r) => (Array.isArray(r) ? r[0] : ""));
    return normalizeImportedNames(firstColumn);
  };

  const handleImportFile = async (file: File) => {
    const lowerName = file.name.toLowerCase();
    let imported: string[] = [];

    if (lowerName.endsWith(".csv")) {
      const text = await file.text();
      imported = parseCsvLikeTextToNames(text);
    } else if (lowerName.endsWith(".xlsx") || lowerName.endsWith(".xls")) {
      imported = await parseExcelToNames(file);
    } else {
      imported = parseCsvLikeTextToNames(await file.text());
    }

    if (imported.length === 0) return;

    const merged = [...names];
    const seen = new Set(merged);
    for (const n of imported) {
      if (seen.has(n)) continue;
      seen.add(n);
      merged.push(n);
    }

    updateNames(merged);
  };

  return (
    <>
      <Box
        width="full"
        borderRadius="xl"
        overflow="hidden"
        boxShadow="xl"
        bg="white"
        _dark={{ bg: "gray.800" }}
        borderWidth="1px"
        borderColor="gray.200"
        height="full"
        p={6}
      >
        <EditableHeader
          headerText={headerText}
          setHeaderText={setHeaderText}
          pickRandomHeader={pickRandomHeader}
        />

        <Box>
          <Flex align="center" justify="start" gap={2}>
            <Button
              bg="#EAEAEA"
              color="#333333"
              borderRadius="4px"
              _hover={{ bg: "#CCCCCC" }}
              onClick={() => {
                const shuffled = [...names].sort(() => Math.random() - 0.9);
                updateNames(shuffled);
              }}
              display="flex"
              alignItems="center"
            >
              <ShuffleIcon color="#888888" />
              <Box display={{ base: "none", md: "block" }} color="#333333">
                Shuffle
              </Box>
            </Button>
            <Button
              bg="#EAEAEA"
              color="#333333"
              borderRadius="4px"
              _hover={{ bg: "#CCCCCC" }}
              onClick={() => {
                const sortedNames = isAscending
                  ? [...names].sort((a, b) => a.localeCompare(b))
                  : [...names].sort((a, b) => b.localeCompare(a));
                updateNames(sortedNames);
                setIsAscending(!isAscending);
              }}
              display="flex"
              alignItems="center"
            >
              {isAscending ? (
                <SortAZIcon color="#888888" />
              ) : (
                <SortZAIcon color="#888888" />
              )}
              <Box display={{ base: "none", md: "block" }} color="#333333">
                Sort
              </Box>
            </Button>
            <Button
              bg="#EAEAEA"
              color="#333333"
              borderRadius="4px"
              _hover={{ bg: "#CCCCCC" }}
              onClick={() => {
                updateNames([]);
              }}
              display="flex"
              alignItems="center"
            >
              <DeleteIcon color="#888888" />
              <Box display={{ base: "none", md: "block" }} color="#333333">
                Clear
              </Box>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                try {
                  await handleImportFile(file);
                } catch (err) {
                  console.error("Import failed:", err);
                  alert("Import failed. Please check the file format.");
                } finally {
                  e.target.value = "";
                }
              }}
            />
            <Button
              bg="#EAEAEA"
              color="#333333"
              borderRadius="4px"
              _hover={{ bg: "#CCCCCC" }}
              onClick={() => fileInputRef.current?.click()}
              display="flex"
              alignItems="center"
            >
              <UploadIcon color="#888888" />
              <Box display={{ base: "none", md: "block" }} color="#333333">
                Import
              </Box>
            </Button>
          </Flex>
        </Box>

        <Box mt={6}>
          <textarea
            placeholder="Enter names, one per line"
            style={{
              width: "100%",
              height: "auto",
              minHeight: "500px",
              resize: "none",
              backgroundColor: "#F8F7F3",
              border: "1px solid #CCCCCC",
              borderRadius: "4px",
              padding: "10px",
              fontFamily: "Arial, sans-serif",
              fontSize: "14px",
            }}
            onChange={handleTextareaChange}
          />
        </Box>
      </Box>
    </>
  );
};
