/* global chrome */
import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Typewriter } from "./Typewriter";

import {
  Box,
  Paper,
  Typography,
  Stack,
  Button,
  IconButton,
  Tooltip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Divider,
  Snackbar,
  Alert,
  ThemeProvider,
  createTheme,
} from "@mui/material";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const theme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#1976d2" },
    success: { main: "#2e7d32" },
    background: { default: "#0b0f14", paper: "#11161c" },
  },
});

export default function Summarizer() {
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [type, setType] = useState("concise");
  const [messageOnDelay, setMessageOnDelay] = useState("");
  const [typedText, setTypedText] = useState("");
  const [fetchedLocally, setFetchedLocally] = useState(false);
  let ifDelayed = null;

  useEffect(() => {
    chrome.storage.local.get(["lastSummary"], (result) => {
      if (result.lastSummary) {
        setResponse(result.lastSummary);
        setFetchedLocally(true);
      }
    });
  }, []);

  const handleSummarize = async () => {
    setResponse("");
    setFetchedLocally(false);
    setLoading(true);

    const getPageText = () => {
      return new Promise((resolve, reject) => {
        chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
          if (!tab || !tab.id) {
            reject("No active tab found");
            return;
          }

          chrome.tabs.sendMessage(
            tab.id,
            { type: "GET_ARTICLE_TEXT" },
            (res) => {
              if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError.message);
                return;
              }
              resolve(res?.extractedText || "");
            }
          );
        });
      });
    };

    ifDelayed = setTimeout(() => {
      setMessageOnDelay("Response can take a while depending on the web page.");
    }, 5000);

    try {
      const tempQuery = await getPageText();
      const res = await fetch(
        "https://briefly-backend-gf5a.onrender.com/api/briefly",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: type,
            content: tempQuery,
          }),
        }
      );

      const data = await res.json();
      const content = data.choices[0].message.content;

      setResponse(content);
      chrome.storage.local.set({ lastSummary: content });
    } catch {
      setResponse("❌ Could not extract or summarize this page!");
    }

    clearTimeout(ifDelayed);
    setMessageOnDelay("");
    setLoading(false);
  };

  const handleClear = () => {
    setResponse("");
    setCopied(false);
    setLoading(false);
    clearTimeout(ifDelayed);
    setMessageOnDelay("");
    chrome.storage.local.remove("lastSummary");
  };

  const handleCopy = async () => {
    if (response) {
      await navigator.clipboard.writeText(response);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleTypeChange = (event) => setType(event.target.value);

  return (
    <ThemeProvider theme={theme}>
      <Paper
        elevation={7}
        sx={{ p: 2, height: 600, display: "flex", flexDirection: "column" }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6" fontWeight={700}>
            Briefly - Quick AI Summary
          </Typography>

          <Stack direction="row" spacing={1}>
            {response && !copied && (
              <Tooltip title="Copy summary">
                <IconButton size="small" onClick={handleCopy} color="primary">
                  <ContentCopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {copied && (
              <Tooltip title="Copied!">
                <IconButton size="small" color="success">
                  <CheckCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>

        <Divider sx={{ my: 1.5 }} />

        <Stack direction="row" spacing={1.5} alignItems="center">
          <FormControl size="small" fullWidth>
            <InputLabel id="ss-type-label">Style</InputLabel>
            <Select
              labelId="ss-type-label"
              value={type}
              label="Style"
              onChange={handleTypeChange}
            >
              <MenuItem value="concise">Concise</MenuItem>
              <MenuItem value="detailed">Detailed</MenuItem>
              <MenuItem value="bullets">Bullets</MenuItem>
            </Select>
          </FormControl>

          <Button
            variant="contained"
            size="small"
            color="success"
            onClick={handleSummarize}
            disabled={loading}
            sx={{
              fontSize: "0.8rem",
              padding: "5px 10px",
              minWidth: "auto",
            }}
          >
            Summarize
          </Button>

          <Button
            variant="outlined"
            size="small"
            color="error"
            onClick={handleClear}
          >
            Clear
          </Button>
        </Stack>

        <Paper
          variant="outlined"
          sx={{
            mt: 2,
            p: 1.5,
            flex: 1,
            overflow: "auto",
            bgcolor: "background.paper",
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            sx={{ mb: 1 }}
          >
            <Box />
            <Box>{loading && <CircularProgress size={20} />}</Box>
          </Stack>

          {messageOnDelay && (
            <Alert severity="info" sx={{ mb: 1 }}>
              <ReactMarkdown>{messageOnDelay}</ReactMarkdown>
            </Alert>
          )}

          {response ? (
            <Box sx={{ whiteSpace: "pre-wrap" }}>
              {!fetchedLocally && (
                <Typewriter text={response} onChange={setTypedText} />
              )}
              <ReactMarkdown>
                {!fetchedLocally ? typedText : response}
              </ReactMarkdown>
            </Box>
          ) : (
            !loading && (
              <Typography variant="body2" color="text.secondary">
                Select how you want this page summarized…
              </Typography>
            )
          )}
        </Paper>
      </Paper>

      <Snackbar
        open={copied}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" sx={{ width: "100%" }}>
          Copied to clipboard
        </Alert>
      </Snackbar>
    </ThemeProvider>
  );
}
