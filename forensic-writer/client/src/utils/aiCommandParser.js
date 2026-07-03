/**
 * AI Command Parser
 * Interprets structured JSON from AI responses to trigger frontend actions.
 * Example AI output: {"action": "NAVIGATE", "path": "/cases", "params": {"search": "FW-4056"}}
 */

export const parseAICommand = (responseString, navigate) => {
    try {
        // Find JSON block in the response
        const jsonMatch = responseString.match(/\{[\s\S]*\}/);
        if (!jsonMatch) return null;

        const command = JSON.parse(jsonMatch[0]);
        console.log('AI Command detected:', command);

        switch (command.action) {
            case 'NAVIGATE':
                if (command.path) {
                    navigate(command.path);
                    return `Navigating to ${command.path}...`;
                }
                break;
            case 'OPEN_CASE':
                if (command.caseId) {
                    navigate(`/cases/${command.caseId}`);
                    return `Opening case ${command.caseId}...`;
                }
                break;
            case 'UPLOAD_EVIDENCE':
                navigate('/upload');
                return "Opening Evidence Vault...";
            case 'SHOW_REPORTS':
                navigate('/reports');
                return "Opening Reports section...";
            default:
                console.warn('Unknown AI action:', command.action);
        }
    } catch (e) {
        // Fallback for non-JSON responses
        return null;
    }
    return null;
};
