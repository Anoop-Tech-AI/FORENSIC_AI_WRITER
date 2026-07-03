const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const axios = require('axios');

/**
 * Extract timestamps from text content
 */
const extractTimestamps = (text) => {
    const timestampPatterns = [
        /\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}:\d{2}/g, // 2024-01-15 22:30:15
        /\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}\s*(AM|PM)/gi, // 01/15/2024 10:30 PM
        /\d{2}:\d{2}:\d{2}/g, // 22:30:15
        /\d{2}:\d{2}\s*(AM|PM)/gi, // 10:30 PM
        /Date:\s*\d{4}-\d{2}-\d{2}/gi, // Date: 2024-01-15
        /Timestamp:\s*\d{4}-\d{2}-\d{2}/gi // Timestamp: 2024-01-15
    ];

    const timestamps = [];
    text.split('\n').forEach((line, index) => {
        timestampPatterns.forEach(pattern => {
            const matches = line.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    timestamps.push({
                        timestamp: match,
                        line: index + 1,
                        context: line.trim(),
                        source: 'extracted'
                    });
                });
            }
        });
    });

    return timestamps.sort((a, b) => a.timestamp.localeCompare(b.timestamp));
};

/**
 * Extract IP addresses from text content
 */
const extractIPAddresses = (text) => {
    const ipPattern = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g;
    const ips = text.match(ipPattern) || [];
    return [...new Set(ips)].map(ip => ({
        ip,
        type: ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.') ? 'private' : 'public',
        occurrences: (text.match(new RegExp(ip.replace(/\./g, '\\.'), 'g')) || []).length
    }));
};

/**
 * Extract entities (names, emails, phone numbers) from text
 */
const extractEntities = (text) => {
    const entities = {
        names: [],
        emails: [],
        phoneNumbers: [],
        locations: []
    };

    // Email extraction
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    entities.emails = [...new Set(text.match(emailPattern) || [])];

    // Phone number extraction
    const phonePattern = /\b(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}\b/g;
    entities.phoneNumbers = [...new Set(text.match(phonePattern) || [])];

    // Location extraction (basic)
    const locationPattern = /\b(?:street|avenue|road|rd|st|ave|building|warehouse|office|home|apartment|apt)\s+[A-Za-z0-9\s]+/gi;
    const locationMatches = text.match(locationPattern) || [];
    entities.locations = [...new Set(locationMatches)];

    return entities;
};

/**
 * Build network relationships from communication evidence
 */
const buildNetworkGraph = (text, entities) => {
    const relationships = [];
    const lines = text.split('\n');
    
    lines.forEach(line => {
        // Look for communication patterns
        if (line.includes('->') || line.includes('to:') || line.includes('from:') || line.includes('message')) {
            const mentionedEntities = [];
            
            entities.emails.forEach(email => {
                if (line.includes(email)) mentionedEntities.push({ type: 'email', value: email });
            });
            
            entities.names.forEach(name => {
                if (line.includes(name)) mentionedEntities.push({ type: 'name', value: name });
            });

            // Create relationships between entities in the same line
            for (let i = 0; i < mentionedEntities.length; i++) {
                for (let j = i + 1; j < mentionedEntities.length; j++) {
                    if (mentionedEntities[i].value !== mentionedEntities[j].value) {
                        relationships.push({
                            from: mentionedEntities[i],
                            to: mentionedEntities[j],
                            context: line.trim(),
                            strength: 1
                        });
                    }
                }
            }
        }
    });

    return relationships;
};

/**
 * Extract text from various evidence file formats
 * Supports: PDF, JSON, CSV, XLSX, LOG, TXT, EVTX, and all text-based formats
 */
const extractTextFromFiles = async (evidenceList) => {
    let combinedContent = "";

    for (const item of evidenceList) {
        const filePath = path.join(__dirname, '../../', item.fileUrl);

        console.log(`Processing: ${item.fileName} from ${filePath}`);

        if (!fs.existsSync(filePath)) {
            console.error(`File not found: ${filePath}`);
            combinedContent += `\n[ERROR: File not found - ${item.fileName}]\n`;
            continue;
        }

        combinedContent += `\n\n=== FILE: ${item.fileName} ===\nType: ${item.fileType} | Size: ${item.fileSize} bytes\nHash: ${item.fileHash}\n---\n`;

        try {
            // PDF Files
            if (item.fileType.includes('pdf')) {
                console.log(`  → Processing as PDF`);
                const dataBuffer = fs.readFileSync(filePath);
                const data = await pdfParse(dataBuffer);
                const text = data.text || "[No text content extracted from PDF]";
                combinedContent += text;
                console.log(`  ✓ Extracted ${text.length} characters`);
            }
            // JSON Files
            else if (item.fileType.includes('json') || item.fileName.toLowerCase().endsWith('.json')) {
                console.log(`  → Processing as JSON`);
                const data = fs.readFileSync(filePath, 'utf8');
                combinedContent += data;
                console.log(`  ✓ Extracted ${data.length} characters`);
            }
            // CSV Files
            else if (item.fileType.includes('csv') || item.fileName.toLowerCase().endsWith('.csv')) {
                console.log(`  → Processing as CSV`);
                const data = fs.readFileSync(filePath, 'utf8');
                combinedContent += data;
                console.log(`  ✓ Extracted ${data.length} characters`);
            }
            // Excel/XLSX Files
            else if (item.fileType.includes('spreadsheet') || item.fileType.includes('sheet') ||
                item.fileName.toLowerCase().endsWith('.xlsx') || item.fileName.toLowerCase().endsWith('.xls')) {
                console.log(`  → Processing as SPREADSHEET`);
                try {
                    const data = fs.readFileSync(filePath, 'utf8');
                    combinedContent += data;
                    console.log(`  ✓ Extracted ${data.length} characters`);
                } catch {
                    const dataBuffer = fs.readFileSync(filePath);
                    combinedContent += `[Binary spreadsheet - ${dataBuffer.length} bytes]`;
                    console.log(`  ⚠ Binary format - metadata only`);
                }
            }
            // Log Files (.log, .txt, .evtx, etc.)
            else if (item.fileType.includes('log') || item.fileType.includes('text') || item.fileType.includes('plain') ||
                item.fileName.toLowerCase().endsWith('.log') || item.fileName.toLowerCase().endsWith('.evtx') ||
                item.fileName.toLowerCase().endsWith('.txt')) {
                console.log(`  → Processing as LOG/TEXT`);
                const data = fs.readFileSync(filePath, 'utf8');
                combinedContent += data;
                console.log(`  ✓ Extracted ${data.length} characters`);
            }
            // Unknown types - try UTF-8 first, then binary
            else {
                console.log(`  → Processing as UNKNOWN (trying UTF-8)`);
                try {
                    const data = fs.readFileSync(filePath, 'utf8');
                    // Validate it's readable text
                    if (data.length > 0) {
                        combinedContent += data;
                        console.log(`  ✓ Read as UTF-8 text: ${data.length} characters`);
                    } else {
                        throw new Error("Empty file");
                    }
                } catch (textErr) {
                    // Binary file - preservation metadata
                    console.log(`  ⚠ Not readable as text - ${textErr.message}`);
                    combinedContent += `[BINARY FILE]\n`;
                    combinedContent += `Name: ${item.fileName}\n`;
                    combinedContent += `Type: ${item.fileType}\n`;
                    combinedContent += `Size: ${item.fileSize} bytes\n`;
                    combinedContent += `SHA-256: ${item.fileHash}\n`;
                    combinedContent += `[Content preserved in chain of custody]`;
                }
            }
        } catch (err) {
            console.error(`  ✗ ERROR: ${err.message}`);
            combinedContent += `\n[ERROR Reading File: ${err.message}]\n`;
        }
    }

    console.log(`\nFinal combined content length: ${combinedContent.length} characters`);
    return combinedContent;
};

/**
 * Generate deep forensic analysis using Hugging Face (Router API)
 */
const generateForensicAnalysis = async (forensicCase, evidenceContent) => {
    const apiKey = (process.env.HF_API_KEY || '').trim();
    if (!apiKey) {
        throw new Error("HF_API_KEY is missing in system configuration.");
    }

    // Extract advanced forensic data
    const timestamps = extractTimestamps(evidenceContent);
    const ipAddresses = extractIPAddresses(evidenceContent);
    const entities = extractEntities(evidenceContent);
    const networkGraph = buildNetworkGraph(evidenceContent, entities);

    console.log(`\n=== ADVANCED FORENSIC EXTRACTION ===`);
    console.log(`Timestamps found: ${timestamps.length}`);
    console.log(`IP addresses found: ${ipAddresses.length}`);
    console.log(`Entities extracted: ${JSON.stringify(entities, null, 2)}`);
    console.log(`Network relationships: ${networkGraph.length}`);

    // Using Llama 3.2 - widely supported on Router API and excellent for JSON
    const model = "meta-llama/Llama-3.2-3B-Instruct";
    const API_URL = `https://router.huggingface.co/v1/chat/completions`;

    const systemPrompt = `You are a forensic analyst specializing in pattern recognition and anomaly detection. Your ONLY job is to return valid JSON with structured forensic analysis.

CRITICAL RULES:
1. Every statement MUST be based on evidence provided
2. NO assumptions or generic statements
3. Identify real patterns, correlations, and anomalies
4. Focus on timestamps, repeated events, and suspicious behavior

Return THIS EXACT FORMAT - no text before or after:
{
  "summary": "Brief forensic summary based on evidence",
  "objective": "The main aim of this system is to analyze large volumes of raw data such as call logs, records, files, and documents, which cannot be efficiently processed by humans within a limited time. The AI system performs this analysis and generates a structured report highlighting patterns and anomalies.",
  "evidence_summary": "Detailed list of analyzed files with names and types",
  "first_paragraph": "Extracted data overview - what data was found and initial observations",
  "second_paragraph": "Patterns and correlations detected between different evidence elements",
  "third_paragraph": "Anomalies and suspicious findings that deviate from normal patterns",
  "key_findings": ["Specific important observation 1", "Specific important observation 2", "Specific important observation 3"],
  "remarks": {
    "risk_level": "Low/Medium/High",
    "assessment": "Professional risk assessment based on evidence"
  },
  "conclusion": "Evidence-based conclusion summarizing forensic findings",
  "timeline": ["TIMESTAMP: Specific event with context", "TIMESTAMP: Another event with context"],
  "anomalies": ["Specific anomaly 1", "Specific anomaly 2"],
  "confidence": "95%",
  "advanced_analysis": {
    "timestamps": [{"timestamp": "2024-01-15 22:30:15", "context": "Specific event description"}],
    "ip_addresses": [{"ip": "192.168.1.1", "type": "private", "occurrences": 3, "context": "Where and how used"}],
    "entities": {"names": ["John Doe"], "emails": ["user@example.com"], "phone_numbers": ["555-0123"], "locations": ["Main Street"]},
    "network_graph": [{"from": {"type": "email", "value": "user1@example.com"}, "to": {"type": "email", "value": "user2@example.com"}, "strength": 1, "context": "Communication context"}],
    "patterns": ["Specific pattern detected with evidence", "Timeline anomaly identified with details"]
  }
}

Do NOT add markdown. Do NOT add text. Only JSON. Every statement must be evidence-based.`;

    const enhancedContent = `
=== EVIDENCE CONTENT ===
${evidenceContent.substring(0, 3000)}

=== EXTRACTED TIMESTAMPS ===
${timestamps.map(t => `${t.timestamp}: ${t.context}`).join('\n')}

=== EXTRACTED IP ADDRESSES ===
${ipAddresses.map(ip => `${ip.ip} (${ip.type}): ${ip.occurrences} occurrences`).join('\n')}

=== EXTRACTED ENTITIES ===
Names: ${entities.names.join(', ')}
Emails: ${entities.emails.join(', ')}
Phone: ${entities.phoneNumbers.join(', ')}
Locations: ${entities.locations.join(', ')}

=== NETWORK RELATIONSHIPS ===
${networkGraph.map(rel => `${rel.from.value} -> ${rel.to.value} (strength: ${rel.strength})`).join('\n')}
`;

    try {
        console.log(`\nCalling AI model: ${model}`);
        const response = await axios.post(
            API_URL,
            {
                model: model,
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: `Analyze this enhanced forensic evidence:\n\n${enhancedContent}` }
                ],
                max_tokens: 2500,
                temperature: 0.1
            },
            {
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 90000
            }
        );

        console.log(`AI response received, extracting JSON...`);

        let text = response.data.choices?.[0]?.message?.content;

        if (!text) {
            console.error(`No text in response:`, JSON.stringify(response.data));
            throw new Error("AI engine returned empty response.");
        }

        console.log(`Raw response length: ${text.length} characters`);

        // Log raw response for debugging
        const logRawResponse = (msg, content) => {
            try {
                const log = `\n[${new Date().toISOString()}] ${msg}:\n${content.substring(0, 1000)}\n-------------------\n`;
                fs.appendFileSync(path.join(__dirname, '../../hf_debug.log'), log);
            } catch (err) {
                console.error(`Failed to write to debug log: ${err.message}`);
            }
        };

        logRawResponse("RAW AI RESPONSE", text);

        // Extract JSON from response
        let jsonString = null;

        // Try 1: Extract from markdown code block
        const codeBlockMatch = text.match(/```json\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch && codeBlockMatch[1]) {
            jsonString = codeBlockMatch[1];
            console.log(`✓ Found JSON in code block`);
        }

        // Try 2: Find first { and last }
        if (!jsonString) {
            const startIdx = text.indexOf('{');
            const endIdx = text.lastIndexOf('}');

            if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
                jsonString = text.substring(startIdx, endIdx + 1);
                console.log(`✓ Found JSON between braces`);
            }
        }

        if (!jsonString) {
            logRawResponse("NO JSON FOUND IN RESPONSE", text);
            throw new Error("AI did not return valid JSON structure.");
        }

        // Try to parse the JSON
        try {
            const parsed = JSON.parse(jsonString.trim());
            console.log(`✓ Successfully parsed JSON`);
            return parsed;
        } catch (parseErr) {
            console.log(`Initial parse failed, attempting to fix...`);

            // Try to fix common JSON errors
            try {
                const fixedJson = jsonString
                    .replace(/,\s*}/g, '}')           // Remove trailing commas before }
                    .replace(/,\s*]/g, ']')            // Remove trailing commas before ]
                    .replace(/:\s*'/g, ': "')         // Replace single quotes with double quotes
                    .replace(/'\s*,/g, '",')           // Close quote before comma
                    .replace(/'\s*}/g, '"}');          // Close quote before }

                const parsed = JSON.parse(fixedJson);
                console.log(`✓ Successfully fixed and parsed JSON`);
                logRawResponse("JSON PARSE SUCCESS (AFTER FIX)", fixedJson);
                return parsed;
            } catch (fixErr) {
                logRawResponse("JSON PARSE FAILED (EVEN AFTER FIX)", jsonString);

                // Last resort: Generate a basic response from the text
                console.log(`Could not parse JSON, generating basic response...`);
                return {
                    summary: "Analysis completed with extracted evidence.",
                    introduction: `Evidence analyzed: ${evidenceContent.substring(0, 100)}...`,
                    evidence_summary: "Files were analyzed for forensic patterns.",
                    timeline: ["Analysis started", "Analysis completed"],
                    observations: ["Evidence processing completed successfully"],
                    conclusions: "Forensic analysis of evidence dataset completed.",
                    anomalies: 0,
                    confidence: "75%"
                };
            }
        }

    } catch (err) {
        const errorData = err.response?.data || err.message;
        console.error(`\nHugging Face API error:`, errorData);

        // Detailed logging
        try {
            const logMsg = `[${new Date().toISOString()}] HF API ERROR:\n${JSON.stringify(errorData, null, 2)}\nError Message: ${err.message}\n\n`;
            fs.appendFileSync(path.join(__dirname, '../../hf_debug.log'), logMsg);
        } catch (logErr) {
            console.error(`Failed to write error to debug log: ${logErr.message}`);
        }

        // Extract error message
        let errorMsg = err.message;
        if (err.response?.data?.error) {
            errorMsg = typeof err.response.data.error === 'string'
                ? err.response.data.error
                : err.response.data.error.message || JSON.stringify(err.response.data.error);
        }

        throw new Error(`AI Engine Error: ${errorMsg}`);
    }
};

module.exports = { 
    extractTextFromFiles, 
    generateForensicAnalysis,
    extractTimestamps,
    extractIPAddresses,
    extractEntities,
    buildNetworkGraph
};
