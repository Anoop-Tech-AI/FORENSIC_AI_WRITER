const fs = require('fs');
const path = require('path');

/**
 * AI-Powered Forensic Analysis Engine - Server Version
 * Deep evidence analysis with pattern detection and anomaly identification
 */

class ForensicAnalysisEngine {
    constructor() {
        this.analysisResults = {
            evidence: [],
            patterns: [],
            anomalies: [],
            correlations: [],
            timeline: [],
            criticalFindings: [],
            insights: []
        };
    }

    /**
     * Parse and analyze evidence files from server storage
     */
    async analyzeEvidence(evidenceFiles, caseInfo) {
        this.analysisResults = {
            evidence: [],
            patterns: [],
            anomalies: [],
            correlations: [],
            timeline: [],
            criticalFindings: [],
            insights: [],
            caseInfo
        };

        // Parse each evidence file
        for (const file of evidenceFiles) {
            const parsedData = await this.parseEvidenceFile(file);
            this.analysisResults.evidence.push(parsedData);
        }

        // Perform deep analysis
        this.detectPatterns();
        this.identifyAnomalies();
        this.correlateData();
        this.buildTimeline();
        this.generateInsights();
        this.identifyCriticalFindings();

        return this.analysisResults;
    }

    /**
     * Parse different types of evidence files
     */
    async parseEvidenceFile(file) {
        const content = await this.readFileContent(file);
        const fileType = this.detectFileType(file.fileName, content);
        
        const parsedData = {
            fileName: file.fileName,
            fileType,
            size: file.fileSize,
            uploadTime: file.uploadTime || new Date().toISOString(),
            parsedContent: null,
            metadata: {},
            extractedData: []
        };

        switch (fileType) {
            case 'log':
                parsedData.parsedContent = this.parseLogFile(content);
                break;
            case 'chat':
                parsedData.parsedContent = this.parseChatFile(content);
                break;
            case 'call':
                parsedData.parsedContent = this.parseCallFile(content);
                break;
            case 'document':
                parsedData.parsedContent = this.parseDocumentFile(content);
                break;
            case 'metadata':
                parsedData.parsedContent = this.parseMetadataFile(content);
                break;
            default:
                parsedData.parsedContent = this.parseGenericFile(content);
        }

        return parsedData;
    }

    /**
     * Read file content from server storage
     */
    async readFileContent(file) {
        try {
            const filePath = path.join(__dirname, '../../uploads', path.basename(file.fileUrl));
            if (fs.existsSync(filePath)) {
                return fs.readFileSync(filePath, 'utf8');
            }
            // Fallback for files with different paths
            if (file.fileUrl && file.fileUrl.startsWith('/uploads/')) {
                const altPath = path.join(__dirname, '../../..', file.fileUrl);
                if (fs.existsSync(altPath)) {
                    return fs.readFileSync(altPath, 'utf8');
                }
            }
            return '';
        } catch (error) {
            console.error(`Error reading file ${file.fileName}:`, error);
            return '';
        }
    }

    /**
     * Detect file type based on content and extension
     */
    detectFileType(fileName, content) {
        const extension = fileName.split('.').pop().toLowerCase();
        const contentLower = content.toLowerCase();

        // Log files
        if (['log', 'txt'].includes(extension) && 
            (contentLower.includes('error') || contentLower.includes('warning') || 
             contentLower.includes('info') || /^\d{4}-\d{2}-\d{2}/.test(content))) {
            return 'log';
        }

        // Chat files
        if (contentLower.includes('sent:') || contentLower.includes('received:') ||
            contentLower.includes('[message]') || /\d{2}:\d{2}:\d{2}/.test(content)) {
            return 'chat';
        }

        // Call records
        if (contentLower.includes('call duration') || contentLower.includes('phone number') ||
            contentLower.includes('dialed') || contentLower.includes('received call')) {
            return 'call';
        }

        // Documents
        if (['pdf', 'doc', 'docx'].includes(extension)) {
            return 'document';
        }

        // Metadata
        if (contentLower.includes('metadata') || contentLower.includes('created:') ||
            contentLower.includes('modified:') || contentLower.includes('accessed:')) {
            return 'metadata';
        }

        return 'generic';
    }

    /**
     * Parse log files with timestamp and event extraction
     */
    parseLogFile(content) {
        const lines = content.split('\n');
        const entries = [];
        const ipAddresses = new Set();
        const errorPatterns = [];
        const timePatterns = [];

        for (const line of lines) {
            if (!line.trim()) continue;

            const entry = {
                timestamp: this.extractTimestamp(line),
                level: this.extractLogLevel(line),
                message: line.trim(),
                source: this.extractSource(line),
                ip: this.extractIPAddress(line)
            };

            entries.push(entry);

            if (entry.ip) ipAddresses.add(entry.ip);
            if (entry.level === 'error') errorPatterns.push(entry);
            if (entry.timestamp) timePatterns.push(entry.timestamp);
        }

        return {
            type: 'log',
            entries,
            statistics: {
                totalEntries: entries.length,
                ipAddresses: Array.from(ipAddresses),
                errorCount: errorPatterns.length,
                timeSpan: this.calculateTimeSpan(timePatterns)
            }
        };
    }

    /**
     * Parse chat/message files
     */
    parseChatFile(content) {
        const lines = content.split('\n');
        const messages = [];
        const participants = new Set();
        const timePatterns = [];
        const suspiciousKeywords = ['hack', 'breach', 'steal', 'unauthorized', 'illegal'];

        for (const line of lines) {
            if (!line.trim()) continue;

            const message = {
                timestamp: this.extractTimestamp(line),
                sender: this.extractSender(line),
                content: line.trim(),
                suspicious: this.containsSuspiciousContent(line, suspiciousKeywords)
            };

            messages.push(message);

            if (message.sender) participants.add(message.sender);
            if (message.timestamp) timePatterns.push(message.timestamp);
        }

        return {
            type: 'chat',
            messages,
            statistics: {
                totalMessages: messages.length,
                participants: Array.from(participants),
                suspiciousMessages: messages.filter(m => m.suspicious).length,
                timeSpan: this.calculateTimeSpan(timePatterns)
            }
        };
    }

    /**
     * Parse call records
     */
    parseCallFile(content) {
        const lines = content.split('\n');
        const calls = [];
        const phoneNumbers = new Set();
        const unusualTimes = [];

        for (const line of lines) {
            if (!line.trim()) continue;

            const call = {
                timestamp: this.extractTimestamp(line),
                phoneNumber: this.extractPhoneNumber(line),
                duration: this.extractCallDuration(line),
                type: this.extractCallType(line),
                direction: this.extractCallDirection(line)
            };

            calls.push(call);

            if (call.phoneNumber) phoneNumbers.add(call.phoneNumber);
            if (call.timestamp && this.isUnusualTime(call.timestamp)) {
                unusualTimes.push(call);
            }
        }

        return {
            type: 'call',
            calls,
            statistics: {
                totalCalls: calls.length,
                uniqueNumbers: Array.from(phoneNumbers),
                unusualTimeCalls: unusualTimes.length,
                averageDuration: this.calculateAverageDuration(calls)
            }
        };
    }

    /**
     * Parse document files
     */
    parseDocumentFile(content) {
        const words = content.split(/\s+/);
        const sensitiveKeywords = ['confidential', 'secret', 'private', 'classified', 'internal'];
        const suspiciousWords = words.filter(word => 
            sensitiveKeywords.some(keyword => word.toLowerCase().includes(keyword))
        );

        return {
            type: 'document',
            content: content.substring(0, 1000), // First 1000 chars
            statistics: {
                wordCount: words.length,
                sensitiveKeywords: suspiciousWords.length,
                hasEncryptedContent: /[\x00-\x1F\x7F-\x9F]/.test(content)
            }
        };
    }

    /**
     * Parse metadata files
     */
    parseMetadataFile(content) {
        const metadata = {};
        const lines = content.split('\n');

        for (const line of lines) {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length > 0) {
                metadata[key.trim().toLowerCase()] = valueParts.join(':').trim();
            }
        }

        return {
            type: 'metadata',
            metadata,
            statistics: {
                fieldsCount: Object.keys(metadata).length,
                hasCreationDate: !!metadata.created || !!metadata['creation date'],
                hasModificationDate: !!metadata.modified || !!metadata['modification date']
            }
        };
    }

    /**
     * Parse generic files
     */
    parseGenericFile(content) {
        const lines = content.split('\n');
        const dataPoints = [];
        const patterns = [];

        for (const line of lines) {
            if (!line.trim()) continue;
            
            const dataPoint = {
                content: line.trim(),
                hasNumbers: /\d/.test(line),
                hasEmail: /\S+@\S+\.\S+/.test(line),
                hasURL: /https?:\/\/\S+/.test(line),
                hasIPAddress: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/.test(line)
            };

            dataPoints.push(dataPoint);
        }

        return {
            type: 'generic',
            dataPoints,
            statistics: {
                totalLines: dataPoints.length,
                linesWithNumbers: dataPoints.filter(dp => dp.hasNumbers).length,
                linesWithEmail: dataPoints.filter(dp => dp.hasEmail).length,
                linesWithURL: dataPoints.filter(dp => dp.hasURL).length,
                linesWithIP: dataPoints.filter(dp => dp.hasIPAddress).length
            }
        };
    }

    /**
     * Extract timestamp from line
     */
    extractTimestamp(line) {
        // Common timestamp patterns
        const patterns = [
            /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/,
            /\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}/,
            /\d{2}-\d{2}-\d{4} \d{2}:\d{2}:\d{2}/,
            /\w{3} \d{2} \d{2}:\d{2}:\d{2}/
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                return match[0];
            }
        }

        return null;
    }

    /**
     * Extract log level from line
     */
    extractLogLevel(line) {
        const levels = ['error', 'warning', 'info', 'debug', 'critical', 'fatal'];
        const lowerLine = line.toLowerCase();
        
        for (const level of levels) {
            if (lowerLine.includes(level)) {
                return level;
            }
        }
        
        return 'info';
    }

    /**
     * Extract source from line
     */
    extractSource(line) {
        // Look for common source patterns
        const patterns = [
            /\[([^\]]+)\]/,
            /(\w+)\[\d+\]/,
            /from (\w+)/
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return 'unknown';
    }

    /**
     * Extract IP address from line
     */
    extractIPAddress(line) {
        const ipPattern = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/;
        const match = line.match(ipPattern);
        return match ? match[0] : null;
    }

    /**
     * Extract sender from chat line
     */
    extractSender(line) {
        const patterns = [
            /(\w+):/,
            /\[(\w+)\]/,
            /from (\w+)/i,
            /sent by (\w+)/i
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                return match[1];
            }
        }

        return null;
    }

    /**
     * Check if line contains suspicious content
     */
    containsSuspiciousContent(line, keywords) {
        const lowerLine = line.toLowerCase();
        return keywords.some(keyword => lowerLine.includes(keyword));
    }

    /**
     * Extract phone number from line
     */
    extractPhoneNumber(line) {
        const patterns = [
            /\b\d{3}-\d{3}-\d{4}\b/,
            /\b\d{10}\b/,
            /\+\d{1,3}\s*\d{3,14}\b/
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                return match[0];
            }
        }

        return null;
    }

    /**
     * Extract call duration from line
     */
    extractCallDuration(line) {
        const patterns = [
            /duration:\s*(\d+)/i,
            /(\d+)\s*seconds?/i,
            /(\d+):(\d+)/
        ];

        for (const pattern of patterns) {
            const match = line.match(pattern);
            if (match) {
                if (match[2]) {
                    // MM:SS format
                    return parseInt(match[1]) * 60 + parseInt(match[2]);
                }
                return parseInt(match[1]);
            }
        }

        return 0;
    }

    /**
     * Extract call type from line
     */
    extractCallType(line) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('incoming')) return 'incoming';
        if (lowerLine.includes('outgoing')) return 'outgoing';
        if (lowerLine.includes('missed')) return 'missed';
        return 'unknown';
    }

    /**
     * Extract call direction from line
     */
    extractCallDirection(line) {
        const lowerLine = line.toLowerCase();
        if (lowerLine.includes('received')) return 'incoming';
        if (lowerLine.includes('dialed') || lowerLine.includes('made')) return 'outgoing';
        return 'unknown';
    }

    /**
     * Check if time is unusual (outside business hours)
     */
    isUnusualTime(timestamp) {
        if (!timestamp) return false;
        
        try {
            const date = new Date(timestamp);
            const hour = date.getHours();
            return hour < 6 || hour > 22; // Before 6 AM or after 10 PM
        } catch {
            return false;
        }
    }

    /**
     * Calculate time span from timestamps
     */
    calculateTimeSpan(timestamps) {
        if (timestamps.length < 2) return null;
        
        try {
            const dates = timestamps.map(ts => new Date(ts)).filter(d => !isNaN(d));
            if (dates.length < 2) return null;
            
            dates.sort((a, b) => a - b);
            const start = dates[0];
            const end = dates[dates.length - 1];
            
            return {
                start: start.toISOString(),
                end: end.toISOString(),
                duration: end - start,
                gap: this.findMaxGap(dates)
            };
        } catch {
            return null;
        }
    }

    /**
     * Find maximum gap between consecutive timestamps
     */
    findMaxGap(dates) {
        let maxGap = 0;
        for (let i = 1; i < dates.length; i++) {
            const gap = dates[i] - dates[i - 1];
            if (gap > maxGap) maxGap = gap;
        }
        return maxGap;
    }

    /**
     * Calculate average call duration
     */
    calculateAverageDuration(calls) {
        if (calls.length === 0) return 0;
        const totalDuration = calls.reduce((sum, call) => sum + (call.duration || 0), 0);
        return Math.round(totalDuration / calls.length);
    }

    /**
     * Detect patterns across evidence
     */
    detectPatterns() {
        const patterns = [];

        // Time-based patterns
        const timePatterns = this.detectTimePatterns();
        patterns.push(...timePatterns);

        // Activity patterns
        const activityPatterns = this.detectActivityPatterns();
        patterns.push(...activityPatterns);

        // Communication patterns
        const communicationPatterns = this.detectCommunicationPatterns();
        patterns.push(...communicationPatterns);

        this.analysisResults.patterns = patterns;
    }

    /**
     * Detect time-based patterns
     */
    detectTimePatterns() {
        const patterns = [];
        const allTimestamps = [];

        // Collect all timestamps
        this.analysisResults.evidence.forEach(evidence => {
            if (evidence.parsedContent.entries) {
                evidence.parsedContent.entries.forEach(entry => {
                    if (entry.timestamp) allTimestamps.push(new Date(entry.timestamp));
                });
            }
        });

        if (allTimestamps.length > 0) {
            // Check for unusual time clusters
            const hourCounts = {};
            allTimestamps.forEach(ts => {
                const hour = ts.getHours();
                hourCounts[hour] = (hourCounts[hour] || 0) + 1;
            });

            const peakHours = Object.entries(hourCounts)
                .filter(([_, count]) => count > allTimestamps.length * 0.1)
                .map(([hour, count]) => ({ hour: parseInt(hour), count }));

            if (peakHours.length > 0) {
                patterns.push({
                    type: 'time_cluster',
                    description: `Unusual activity concentration during ${peakHours.map(h => `${h.hour}:00`).join(', ')}`,
                    severity: peakHours.some(h => h.hour >= 22 || h.hour <= 5) ? 'high' : 'medium',
                    data: peakHours
                });
            }
        }

        return patterns;
    }

    /**
     * Detect activity patterns
     */
    detectActivityPatterns() {
        const patterns = [];
        const errorCounts = {};
        const ipActivities = {};

        this.analysisResults.evidence.forEach(evidence => {
            if (evidence.fileType === 'log' && evidence.parsedContent.entries) {
                evidence.parsedContent.entries.forEach(entry => {
                    // Error patterns
                    if (entry.level === 'error') {
                        const source = entry.source || 'unknown';
                        errorCounts[source] = (errorCounts[source] || 0) + 1;
                    }

                    // IP activity patterns
                    if (entry.ip) {
                        ipActivities[entry.ip] = (ipActivities[entry.ip] || 0) + 1;
                    }
                });
            }
        });

        // Check for high error rates
        Object.entries(errorCounts).forEach(([source, count]) => {
            if (count > 10) {
                patterns.push({
                    type: 'error_spike',
                    description: `High error rate from ${source}: ${count} errors`,
                    severity: count > 50 ? 'high' : 'medium',
                    data: { source, count }
                });
            }
        });

        // Check for suspicious IP activity
        Object.entries(ipActivities).forEach(([ip, count]) => {
            if (count > 100) {
                patterns.push({
                    type: 'ip_activity_spike',
                    description: `High activity from IP ${ip}: ${count} events`,
                    severity: 'medium',
                    data: { ip, count }
                });
            }
        });

        return patterns;
    }

    /**
     * Detect communication patterns
     */
    detectCommunicationPatterns() {
        const patterns = [];
        const messageCounts = {};
        const suspiciousSenders = new Set();

        this.analysisResults.evidence.forEach(evidence => {
            if (evidence.fileType === 'chat' && evidence.parsedContent.messages) {
                evidence.parsedContent.messages.forEach(message => {
                    const sender = message.sender || 'unknown';
                    messageCounts[sender] = (messageCounts[sender] || 0) + 1;

                    if (message.suspicious) {
                        suspiciousSenders.add(sender);
                    }
                });
            }
        });

        // Check for message volume anomalies
        Object.entries(messageCounts).forEach(([sender, count]) => {
            const avgMessages = Object.values(messageCounts).reduce((a, b) => a + b, 0) / Object.keys(messageCounts).length;
            
            if (count > avgMessages * 3) {
                patterns.push({
                    type: 'message_volume_anomaly',
                    description: `Unusually high message volume from ${sender}: ${count} messages`,
                    severity: 'medium',
                    data: { sender, count, average: Math.round(avgMessages) }
                });
            }
        });

        // Flag suspicious senders
        if (suspiciousSenders.size > 0) {
            patterns.push({
                type: 'suspicious_communicators',
                description: `Suspicious content detected from ${suspiciousSenders.size} sender(s)`,
                severity: 'high',
                data: { senders: Array.from(suspiciousSenders) }
            });
        }

        return patterns;
    }

    /**
     * Identify anomalies in the data
     */
    identifyAnomalies() {
        const anomalies = [];

        // Check for missing data
        const missingDataAnomalies = this.checkMissingData();
        anomalies.push(...missingDataAnomalies);

        // Check for data inconsistencies
        const inconsistencyAnomalies = this.checkDataInconsistencies();
        anomalies.push(...inconsistencyAnomalies);

        // Check for unauthorized access patterns
        const accessAnomalies = this.checkUnauthorizedAccess();
        anomalies.push(...accessAnomalies);

        this.analysisResults.anomalies = anomalies;
    }

    /**
     * Check for missing data
     */
    checkMissingData() {
        const anomalies = [];

        this.analysisResults.evidence.forEach(evidence => {
            if (evidence.fileType === 'log' && evidence.parsedContent.statistics) {
                const stats = evidence.parsedContent.statistics;
                
                if (stats.totalEntries === 0) {
                    anomalies.push({
                        type: 'missing_data',
                        description: `Log file ${evidence.fileName} contains no entries`,
                        severity: 'medium',
                        evidence: evidence.fileName
                    });
                }

                if (stats.timeSpan && stats.timeSpan.gap > 24 * 60 * 60 * 1000) { // 24 hours gap
                    anomalies.push({
                        type: 'time_gap',
                        description: `Significant time gap detected in ${evidence.fileName}: ${Math.round(stats.timeSpan.gap / (60 * 60 * 1000))} hours`,
                        severity: 'high',
                        evidence: evidence.fileName
                    });
                }
            }
        });

        return anomalies;
    }

    /**
     * Check for data inconsistencies
     */
    checkDataInconsistencies() {
        const anomalies = [];

        // Check for duplicate timestamps across different sources
        const timestampSources = {};
        
        this.analysisResults.evidence.forEach(evidence => {
            if (evidence.parsedContent.entries) {
                evidence.parsedContent.entries.forEach(entry => {
                    if (entry.timestamp) {
                        if (!timestampSources[entry.timestamp]) {
                            timestampSources[entry.timestamp] = [];
                        }
                        timestampSources[entry.timestamp].push({
                            file: evidence.fileName,
                            source: entry.source
                        });
                    }
                });
            }
        });

        Object.entries(timestampSources).forEach(([timestamp, sources]) => {
            if (sources.length > 1) {
                anomalies.push({
                    type: 'duplicate_timestamp',
                    description: `Duplicate timestamp ${timestamp} found in multiple sources: ${sources.map(s => s.file).join(', ')}`,
                    severity: 'medium',
                    data: { timestamp, sources }
                });
            }
        });

        return anomalies;
    }

    /**
     * Check for unauthorized access patterns
     */
    checkUnauthorizedAccess() {
        const anomalies = [];
        const unauthorizedKeywords = ['unauthorized', 'forbidden', 'denied', 'failed login', 'access denied'];

        this.analysisResults.evidence.forEach(evidence => {
            if (evidence.fileType === 'log' && evidence.parsedContent.entries) {
                const unauthorizedEntries = evidence.parsedContent.entries.filter(entry =>
                    unauthorizedKeywords.some(keyword => 
                        entry.message.toLowerCase().includes(keyword)
                    )
                );

                if (unauthorizedEntries.length > 0) {
                    anomalies.push({
                        type: 'unauthorized_access',
                        description: `${unauthorizedEntries.length} unauthorized access attempts detected in ${evidence.fileName}`,
                        severity: 'high',
                        evidence: evidence.fileName,
                        data: { attempts: unauthorizedEntries.length }
                    });
                }
            }
        });

        return anomalies;
    }

    /**
     * Correlate data across multiple evidence files
     */
    correlateData() {
        const correlations = [];

        // Correlate IP addresses across files
        const ipCorrelations = this.correlateIPAddresses();
        correlations.push(...ipCorrelations);

        // Correlate timestamps across files
        const timeCorrelations = this.correlateTimestamps();
        correlations.push(...timeCorrelations);

        // Correlate user activities across files
        const userCorrelations = this.correlateUserActivities();
        correlations.push(...userCorrelations);

        this.analysisResults.correlations = correlations;
    }

    /**
     * Correlate IP addresses across evidence files
     */
    correlateIPAddresses() {
        const correlations = [];
        const ipFiles = {};

        this.analysisResults.evidence.forEach(evidence => {
            if (evidence.parsedContent.statistics && evidence.parsedContent.statistics.ipAddresses) {
                evidence.parsedContent.statistics.ipAddresses.forEach(ip => {
                    if (!ipFiles[ip]) {
                        ipFiles[ip] = [];
                    }
                    ipFiles[ip].push(evidence.fileName);
                });
            }
        });

        Object.entries(ipFiles).forEach(([ip, files]) => {
            if (files.length > 1) {
                correlations.push({
                    type: 'ip_cross_reference',
                    description: `IP address ${ip} appears in multiple files: ${files.join(', ')}`,
                    significance: 'high',
                    data: { ip, files }
                });
            }
        });

        return correlations;
    }

    /**
     * Correlate timestamps across evidence files
     */
    correlateTimestamps() {
        const correlations = [];
        const timeEvents = {};

        this.analysisResults.evidence.forEach(evidence => {
            if (evidence.parsedContent.entries) {
                evidence.parsedContent.entries.forEach(entry => {
                    if (entry.timestamp) {
                        const minuteKey = entry.timestamp.substring(0, 16); // YYYY-MM-DD HH:MM
                        if (!timeEvents[minuteKey]) {
                            timeEvents[minuteKey] = [];
                        }
                        timeEvents[minuteKey].push({
                            file: evidence.fileName,
                            message: entry.message.substring(0, 50)
                        });
                    }
                });
            }
        });

        Object.entries(timeEvents).forEach(([time, events]) => {
            if (events.length > 2) {
                correlations.push({
                    type: 'temporal_correlation',
                    description: `Multiple events at ${time}: ${events.length} related activities`,
                    significance: 'medium',
                    data: { time, events }
                });
            }
        });

        return correlations;
    }

    /**
     * Correlate user activities across files
     */
    correlateUserActivities() {
        const correlations = [];
        const userActivities = {};

        this.analysisResults.evidence.forEach(evidence => {
            if (evidence.fileType === 'chat' && evidence.parsedContent.messages) {
                evidence.parsedContent.messages.forEach(message => {
                    if (message.sender) {
                        if (!userActivities[message.sender]) {
                            userActivities[message.sender] = {
                                files: new Set(),
                                messageCount: 0,
                                suspiciousCount: 0
                            };
                        }
                        userActivities[message.sender].files.add(evidence.fileName);
                        userActivities[message.sender].messageCount++;
                        if (message.suspicious) {
                            userActivities[message.sender].suspiciousCount++;
                        }
                    }
                });
            }
        });

        Object.entries(userActivities).forEach(([user, activity]) => {
            if (activity.files.size > 1) {
                correlations.push({
                    type: 'user_cross_file_activity',
                    description: `User ${user} active across ${activity.files.size} files: ${Array.from(activity.files).join(', ')}`,
                    significance: activity.suspiciousCount > 0 ? 'high' : 'medium',
                    data: { 
                        user, 
                        files: Array.from(activity.files),
                        messageCount: activity.messageCount,
                        suspiciousCount: activity.suspiciousCount
                    }
                });
            }
        });

        return correlations;
    }

    /**
     * Build timeline of events
     */
    buildTimeline() {
        const timeline = [];
        const allEvents = [];

        this.analysisResults.evidence.forEach(evidence => {
            if (evidence.parsedContent.entries) {
                evidence.parsedContent.entries.forEach(entry => {
                    if (entry.timestamp) {
                        allEvents.push({
                            timestamp: new Date(entry.timestamp),
                            file: evidence.fileName,
                            type: evidence.fileType,
                            description: entry.message.substring(0, 100),
                            severity: this.determineEventSeverity(entry)
                        });
                    }
                });
            }

            if (evidence.parsedContent.messages) {
                evidence.parsedContent.messages.forEach(message => {
                    if (message.timestamp) {
                        allEvents.push({
                            timestamp: new Date(message.timestamp),
                            file: evidence.fileName,
                            type: evidence.fileType,
                            description: `Message: ${message.content.substring(0, 50)}...`,
                            severity: message.suspicious ? 'high' : 'low'
                        });
                    }
                });
            }

            if (evidence.parsedContent.calls) {
                evidence.parsedContent.calls.forEach(call => {
                    if (call.timestamp) {
                        allEvents.push({
                            timestamp: new Date(call.timestamp),
                            file: evidence.fileName,
                            type: evidence.fileType,
                            description: `Call to ${call.phoneNumber} (${call.duration}s)`,
                            severity: this.isUnusualTime(call.timestamp) ? 'medium' : 'low'
                        });
                    }
                });
            }
        });

        // Sort events by timestamp
        allEvents.sort((a, b) => a.timestamp - b.timestamp);

        this.analysisResults.timeline = allEvents;
    }

    /**
     * Determine event severity
     */
    determineEventSeverity(entry) {
        if (entry.level === 'error' || entry.level === 'critical' || entry.level === 'fatal') {
            return 'high';
        }
        if (entry.level === 'warning') {
            return 'medium';
        }
        return 'low';
    }

    /**
     * Generate AI insights from the analysis
     */
    generateInsights() {
        const insights = [];

        // Behavioral insights
        const behavioralInsights = this.generateBehavioralInsights();
        insights.push(...behavioralInsights);

        // Security insights
        const securityInsights = this.generateSecurityInsights();
        insights.push(...securityInsights);

        // Operational insights
        const operationalInsights = this.generateOperationalInsights();
        insights.push(...operationalInsights);

        this.analysisResults.insights = insights;
    }

    /**
     * Generate behavioral insights
     */
    generateBehavioralInsights() {
        const insights = [];

        // Analyze communication patterns
        const chatEvidence = this.analysisResults.evidence.filter(e => e.fileType === 'chat');
        if (chatEvidence.length > 0) {
            const totalMessages = chatEvidence.reduce((sum, e) => 
                sum + (e.parsedContent.statistics?.totalMessages || 0), 0
            );
            const suspiciousMessages = chatEvidence.reduce((sum, e) => 
                sum + (e.parsedContent.statistics?.suspiciousMessages || 0), 0
            );

            if (suspiciousMessages > 0) {
                insights.push({
                    type: 'behavioral',
                    category: 'communication',
                    description: `${suspiciousMessages} suspicious messages detected out of ${totalMessages} total communications (${((suspiciousMessages/totalMessages)*100).toFixed(1)}%)`,
                    significance: 'high',
                    recommendation: 'Investigate suspicious communicators and review message content for potential security threats'
                });
            }
        }

        return insights;
    }

    /**
     * Generate security insights
     */
    generateSecurityInsights() {
        const insights = [];

        // Analyze unauthorized access attempts
        const unauthorizedAnomalies = this.analysisResults.anomalies.filter(a => a.type === 'unauthorized_access');
        if (unauthorizedAnomalies.length > 0) {
            const totalAttempts = unauthorizedAnomalies.reduce((sum, a) => sum + a.data.attempts, 0);
            insights.push({
                type: 'security',
                category: 'access_control',
                description: `${totalAttempts} unauthorized access attempts detected across ${unauthorizedAnomalies.length} log files`,
                significance: 'critical',
                recommendation: 'Immediate review of access controls and implementation of additional security measures required'
            });
        }

        // Analyze IP activity patterns
        const ipPatterns = this.analysisResults.patterns.filter(p => p.type === 'ip_activity_spike');
        if (ipPatterns.length > 0) {
            insights.push({
                type: 'security',
                category: 'network_activity',
                description: `${ipPatterns.length} IP addresses showing unusual activity patterns detected`,
                significance: 'high',
                recommendation: 'Investigate source IP addresses and implement network monitoring'
            });
        }

        return insights;
    }

    /**
     * Generate operational insights
     */
    generateOperationalInsights() {
        const insights = [];

        // Analyze error patterns
        const errorPatterns = this.analysisResults.patterns.filter(p => p.type === 'error_spike');
        if (errorPatterns.length > 0) {
            insights.push({
                type: 'operational',
                category: 'system_health',
                description: `${errorPatterns.length} sources showing elevated error rates detected`,
                significance: 'medium',
                recommendation: 'System maintenance and health check recommended for affected components'
            });
        }

        return insights;
    }

    /**
     * Identify critical findings
     */
    identifyCriticalFindings() {
        const criticalFindings = [];

        // High severity anomalies
        const highSeverityAnomalies = this.analysisResults.anomalies.filter(a => a.severity === 'high');
        highSeverityAnomalies.forEach(anomaly => {
            criticalFindings.push({
                type: 'anomaly',
                severity: 'high',
                description: anomaly.description,
                evidence: anomaly.evidence,
                data: anomaly.data
            });
        });

        // High severity patterns
        const highSeverityPatterns = this.analysisResults.patterns.filter(p => p.severity === 'high');
        highSeverityPatterns.forEach(pattern => {
            criticalFindings.push({
                type: 'pattern',
                severity: 'high',
                description: pattern.description,
                data: pattern.data
            });
        });

        // Critical insights
        const criticalInsights = this.analysisResults.insights.filter(i => i.significance === 'critical');
        criticalInsights.forEach(insight => {
            criticalFindings.push({
                type: 'insight',
                severity: 'critical',
                description: insight.description,
                recommendation: insight.recommendation,
                data: insight.data
            });
        });

        this.analysisResults.criticalFindings = criticalFindings;
    }
}

module.exports = ForensicAnalysisEngine;
