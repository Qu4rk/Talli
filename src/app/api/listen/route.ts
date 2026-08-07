import { NextResponse } from "next/server";
import OpenAI from "openai";
import { removeAccents } from "@/lib/greekUtils";

// Allow up to 30 seconds for sequential STT + LLM processing
export const maxDuration = 30;

export interface StudentRosterItem {
  id: number;
  name: string;
  greekName?: string;
  classId: string;
}

export interface DetectionResult {
  detected: boolean;
  studentName: string;
  studentId: number;
  delta: number; // 1 or -1
  reason: string;
  confidence: number;
  triggerWord: string;
}

function getGreekVocative(greekName: string): string {
  const parts = greekName.trim().split(" ");
  const firstName = parts[0];

  let voc = firstName;
  if (firstName.endsWith("ης") || firstName.endsWith("ας") || firstName.endsWith("ις")) {
    voc = firstName.slice(0, -1);
  } else if (firstName.endsWith("ος")) {
    if (firstName === "Αλέξανδρος") {
      voc = "Αλέξανδρε";
    } else if (firstName === "Φίλιππος") {
      voc = "Φίλιππε";
    } else {
      voc = firstName.slice(0, -1);
    }
  }

  const rest = parts.slice(1).join(" ");
  return rest ? `${voc} ${rest}` : voc;
}

const SYSTEM_PROMPT = `You are Talli, an ambient Greek classroom AI behavior tracker.
Your job is to analyze transcribed teacher speech in Greek and detect when a teacher awards merit (+1) or penalty (-1) points to one or multiple students in the class roster.

RULES:
1. Return ALL detected praise or penalty cues in the transcript inside the "detections" array. If a teacher praises or corrects MULTIPLE students in one phrase (e.g. "Μπράβο Ελένη, μπράβο Γιάννη, σταμάτα Νίκο!"), create a detection item for EACH addressed student!
2. Match praise or penalty cues regardless of word order (e.g. "Νίκο μου, σταμάτα!", "Έλα ρε Γιάννη, σταμάτα!", "Ελένη μου, μπράβο σου!").
3. Ignore affectionate diminutives, possessives, and colloquial exclamations like "μου", "σου", "ρε", "έλα ρε", "έλα", "άντε", "σε παρακαλώ", "παιδί μου".
4. Greek teacher speech uses vocative case (e.g. "Γιάννη" for "Γιάννης", "Ανδρέα" for "Ανδρέας", "Νίκο" for "Νίκος", "Πέτρο" for "Πέτρος", "Κώστα" for "Κώστας", "Μιχάλη" for "Μιχάλης", "Αλέξανδρε" for "Αλέξανδρος", "Φίλιππε" for "Φίλιππος"). Always match these vocative forms accurately to the student ID.
5. Merit (+1) praise triggers (ALWAYS set delta = 1): Μπράβο, Μπράβο σου, Εύγε, Πολύ ωραία, Πολύ ωραίος, Σωστά, Σωστός, Σωστή, Εξαιρετικά, Τέλεια, Πολύ καλά, Σωστό, Super, Άριστα, Καλή προσπάθεια.
6. Penalty (-1) correction triggers (ALWAYS set delta = -1): Σταμάτα, Σταμάτησε, Ησυχία, Πρόσεχε, Προσοχή, Μη μιλάς, Μην μιλάς, Κάτσε κάτω, Σιωπή, Στοπ, Φτάνει, Αρκεί.
7. If no student name or clear trigger is present, return "detected": false and "detections": [].
8. "confidence" MUST be an INTEGER percentage between 0 and 100 (e.g., 95 for high certainty, 100 for exact match). Do NOT output decimal fractions like 0.95 or 1.`;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get("audio") as Blob | null;
    const directText = formData.get("text") as string | null;
    const rosterStr = formData.get("roster") as string | null;

    if (!audioBlob && !directText) {
      return NextResponse.json({ error: "Missing audio or text payload" }, { status: 400 });
    }

    const roster: StudentRosterItem[] = rosterStr ? JSON.parse(rosterStr) : [];

    const deepgramKey = process.env.DEEPGRAM_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    const isDeepgramConfigured = Boolean(deepgramKey && !deepgramKey.includes("your_deepgram_api_key"));
    const isOpenRouterConfigured = Boolean(openrouterKey && !openrouterKey.includes("your_openrouter_api_key"));
    const isOpenAIConfigured = Boolean(openaiKey && !openaiKey.includes("your_openai_api_key"));

    let transcript = (directText || "").trim();

    // 1. Speech-to-Text via Deepgram Nova-2 (Greek) if audio is provided & transcript not yet set
    if (!transcript && isDeepgramConfigured && audioBlob) {
      try {
        const buffer = await audioBlob.arrayBuffer();

        // Build dynamic Deepgram keyword boosting parameters from active roster
        const nameKeywords = roster
          .flatMap((s) => [
            s.name.split(" ")[0],
            s.greekName ? s.greekName.split(" ")[0] : null,
            getGreekVocative(s.greekName || s.name).split(" ")[0],
          ])
          .filter(Boolean);
        const uniqueKeywords = Array.from(new Set(nameKeywords));
        const keywordQuery = uniqueKeywords.map((k) => `keywords=${encodeURIComponent(k!)}`).join("&");
        const dgUrl = `https://api.deepgram.com/v1/listen?language=el&model=nova-2&smart_format=true&punctuate=true${keywordQuery ? `&${keywordQuery}` : ""}`;

        const dgRes = await fetch(dgUrl, {
          method: "POST",
          headers: {
            Authorization: `Token ${deepgramKey}`,
            "Content-Type": "audio/wav",
          },
          body: buffer,
        });

        if (dgRes.ok) {
          const dgData = await dgRes.json();
          transcript =
            dgData?.results?.channels?.[0]?.alternatives?.[0]?.transcript || "";
        }
      } catch (err) {
        console.warn("Deepgram STT call error, falling back:", err);
      }
    }

    // Fast-path Rule-Based Pre-parser (0ms local resolution)
    const fastRuleDetections = RuleBasedGreekParser(transcript, roster);

    // 2. Structured Intent & Entity Parsing via OpenRouter or OpenAI if configured
    if ((isOpenRouterConfigured || isOpenAIConfigured) && transcript.trim().length > 0) {
      try {
        const client = isOpenRouterConfigured
          ? new OpenAI({
              apiKey: openrouterKey,
              baseURL: "https://openrouter.ai/api/v1",
              defaultHeaders: {
                "HTTP-Referer": "http://localhost:3000",
                "X-Title": "Talli Classroom Intelligence",
              },
            })
          : new OpenAI({ apiKey: openaiKey });

        const model = isOpenRouterConfigured
          ? process.env.OPENROUTER_MODEL || "openai/gpt-4o-mini"
          : "gpt-4o-mini";

        const rosterFormatted = roster
          .map((s) => {
            const greek = s.greekName || s.name;
            const vocative = getGreekVocative(greek);
            return `ID ${s.id}: ${s.name} (Nominative: ${greek}, Spoken Vocative: ${vocative})`;
          })
          .join("\n");

        const completion = await client.chat.completions.create({
          model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            {
              role: "user",
              content: `Spoken Transcript: "${transcript}"\n\nActive Class Roster:\n${rosterFormatted}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "classroom_detections",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  detected: { type: "boolean" },
                  detections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        studentName: { type: "string" },
                        studentId: { type: "number" },
                        delta: { type: "number" },
                        reason: { type: "string" },
                        confidence: { type: "number" },
                        triggerWord: { type: "string" },
                      },
                      required: [
                        "studentName",
                        "studentId",
                        "delta",
                        "reason",
                        "confidence",
                        "triggerWord",
                      ],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["detected", "detections"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = completion.choices[0]?.message?.content;
        if (content) {
          const parsed = JSON.parse(content) as {
            detected: boolean;
            detections: DetectionResult[];
          };

          // Normalize confidence if LLM returned 0.0-1.0 scale instead of 0-100%
          const normalized = (parsed.detections || []).map((d) => ({
            ...d,
            detected: true,
            confidence: d.confidence <= 1 && d.confidence > 0 ? Math.round(d.confidence * 100) : d.confidence,
          }));

          return NextResponse.json({
            transcript,
            detected: parsed.detected && normalized.length > 0,
            detections: normalized,
            detection: normalized[0] || null,
          });
        }
      } catch (err) {
        console.warn("LLM Intent Parsing error, falling back to fast rule parser:", err);
      }
    }

    return NextResponse.json({
      transcript: transcript || "[Simulated/VAD Audio Chunks Processed]",
      detected: fastRuleDetections.length > 0,
      detections: fastRuleDetections,
      detection: fastRuleDetections[0] || null,
      isPlaceholderMode: !isDeepgramConfigured || !isOpenAIConfigured,
    });
  } catch (err) {
    console.error("API /api/listen error:", err);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}

/**
 * Fast Greek Multi-Entity Rule-based Parser
 */
function RuleBasedGreekParser(
  transcript: string,
  roster: StudentRosterItem[]
): DetectionResult[] {
  const normalizedText = removeAccents(transcript);
  if (!normalizedText.trim()) return [];

  const positiveTriggers = [
    "μπραβο", "ευγε", "πολυ ωραια", "πολυ ωραιος", "σωστα", "σωστος", "σωστη",
    "εξαιρετικα", "τελεια", "πολυ καλα", "σωστο", "super", "αριστα", "καλη προσπαθεια"
  ];
  const negativeTriggers = [
    "σταματα", "σταματησε", "ησυχια", "προσεχε", "προσοχη",
    "μη μιλας", "μην μιλας", "κατσε κατω", "σιωπη", "στοπ", "φτανει", "αρκει"
  ];

  const results: DetectionResult[] = [];

  for (const student of roster) {
    const nameNorm = removeAccents(student.name);
    const greekNorm = removeAccents(student.greekName || student.name);
    const greekFirstNameNorm = greekNorm.split(" ")[0];

    const vocativeFullNorm = removeAccents(getGreekVocative(student.greekName || student.name));
    const vocativeFirstNameNorm = vocativeFullNorm.split(" ")[0];

    const isStudentMentioned =
      (nameNorm.length > 2 && normalizedText.includes(nameNorm)) ||
      (greekNorm.length > 2 && normalizedText.includes(greekNorm)) ||
      (greekFirstNameNorm.length > 2 && normalizedText.includes(greekFirstNameNorm)) ||
      (vocativeFullNorm.length > 2 && normalizedText.includes(vocativeFullNorm)) ||
      (vocativeFirstNameNorm.length > 2 && normalizedText.includes(vocativeFirstNameNorm));

    if (isStudentMentioned) {
      let foundDelta = 0;
      let foundTrigger = "";

      for (const p of positiveTriggers) {
        if (normalizedText.includes(p)) {
          foundDelta = 1;
          foundTrigger = p;
          break;
        }
      }

      if (foundDelta === 0) {
        for (const n of negativeTriggers) {
          if (normalizedText.includes(n)) {
            foundDelta = -1;
            foundTrigger = n;
            break;
          }
        }
      }

      if (foundDelta !== 0) {
        results.push({
          detected: true,
          studentName: student.name,
          studentId: student.id,
          delta: foundDelta,
          reason: `${foundTrigger.charAt(0).toUpperCase() + foundTrigger.slice(1)} ${student.name}`,
          confidence: 96,
          triggerWord: foundTrigger,
        });
      }
    }
  }

  return results;
}
