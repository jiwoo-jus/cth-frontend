// ... other imports ...
import { PaperContext } from '../../../contexts/PaperContext';
// src/components/search/cards/ResultCardCTG.js
import React, { useContext } from 'react';

function ResultCardCTG({ item }) {
    const { ctg_data, display_id } = item;
    const { setSelectedPaper } = useContext(PaperContext);
    const navigate = useNavigate();

    if (!ctg_data || !ctg_data.protocolSection) {
        return <div className="result-card error">Error: CTG data missing or malformed.</div>;
    }

    const identificationModule = ctg_data.protocolSection.identificationModule || {};
    const statusModule = ctg_data.protocolSection.statusModule || {};
    const conditionsModule = ctg_data.protocolSection.conditionsModule || {};
    const designModule = ctg_data.protocolSection.designModule || {};


    const handleViewDetails = () => {
        setSelectedPaper({
            id: display_id, // This is NCTID
            source: 'CTG',
            title: identificationModule.briefTitle,
            // Pass the full ctg_data if PaperDetailPage expects it for CTG
            fullStudyData: ctg_data 
        });
        navigate(`/paper/${display_id}?source=CTG`);
    };

    return (
        <Card className="mb-3 result-card ctg-card shadow-sm">
            <Card.Header className="d-flex justify-content-between align-items-center result-card-header">
                <Badge bg="success" className="source-badge">ClinicalTrials.gov</Badge>
                {identificationModule.nctId && <small className="text-muted">NCT ID: {identificationModule.nctId}</small>}
            </Card.Header>
            <Card.Body>
                <Card.Title className="result-title">{identificationModule.briefTitle || 'No Title'}</Card.Title>
                <div className="result-meta">
                    {statusModule.overallStatus && <p><strong>Status:</strong> {statusModule.overallStatus}</p>}
                    {conditionsModule.conditionList?.condition?.length > 0 && (
                        <p><strong>Conditions:</strong> {conditionsModule.conditionList.condition.slice(0,3).join(', ')}</p>
                    )}
                    {designModule.studyType && <p><strong>Study Type:</strong> {designModule.studyType}</p>}
                     {/* Display phases if available */}
                    {designModule.phases && designModule.phases.length > 0 && (
                        <p><strong>Phases:</strong> {designModule.phases.join(', ')}</p>
                    )}
                </div>
                {/* For CTG, a snippet of the brief summary or description could be shown if needed */}
                 {ctg_data.protocolSection?.descriptionModule?.briefSummary && (
                    <div className="abstract-preview mt-2">
                        <strong>Summary: </strong>
                        <div style={{ whiteSpace: 'pre-line' }}>
                            {ctg_data.protocolSection.descriptionModule.briefSummary.length > 300
                                ? ctg_data.protocolSection.descriptionModule.briefSummary.substring(0, 300) + "..."
                                : ctg_data.protocolSection.descriptionModule.briefSummary}
                        </div>
                    </div>
                )}
            </Card.Body>
            <Card.Footer className="text-end">
                 <Button variant="outline-success" size="sm" onClick={handleViewDetails}>
                    View Details
                </Button>
            </Card.Footer>
        </Card>
    );
}

export default ResultCardCTG;