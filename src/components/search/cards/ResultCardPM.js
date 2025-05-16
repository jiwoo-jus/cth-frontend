// ... other imports ...
import { PaperContext } from '../../../contexts/PaperContext';
import { SearchContext } from '../../../contexts/SearchContext'; // Corrected path
// src/components/search/cards/ResultCardPM.js
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom'; // Added useNavigate import
import { Card, Badge, Button } from 'react-bootstrap'; // Added react-bootstrap imports

// For detail page navigation

function ResultCardPM({ paper }) { // Assuming 'paper' is a prop
    // Add a check for paper and paper.pm_data
    if (!paper) {
        console.error("ResultCardPM received undefined paper prop");
        return <div className="result-card error">Error: Paper data is missing.</div>;
    }
    if (!paper.pm_data) {
        console.error("ResultCardPM received paper prop without pm_data:", paper);
        // Optionally, you could try to render a minimal card or a specific error message
        // For now, returning a generic error or null might be best
        return (
            <Card className="mb-3 result-card error-card shadow-sm">
                <Card.Header>Error</Card.Header>
                <Card.Body>
                    <Card.Title>Data Error</Card.Title>
                    <Card.Text>
                        There was an issue loading the data for this PubMed/PMC entry (ID: {paper.display_id || 'Unknown'}).
                    </Card.Text>
                </Card.Body>
            </Card>
        );
    }

    const searchContext = useContext(SearchContext);
    const paperContext = useContext(PaperContext);

    // Fallback if contexts are not yet available (though App structure should prevent this)
    const setSelectedPaperSearch = searchContext ? searchContext.setSelectedPaper : () => console.warn("SearchContext not available for setSelectedPaper");
    const setSelectedPaperPaper = paperContext ? paperContext.setSelectedPaper : () => console.warn("PaperContext not available for setSelectedPaper");

    // Now it's safe to destructure
    const { pm_data, associated_ctg_studies, display_id } = paper;
    const navigate = useNavigate();

    // This check is now redundant due to the one at the top, but kept for clarity if you remove the top one.
    // if (!pm_data) {
    //     return <div className="result-card error">Error: PM data missing for this card.</div>;
    // }
    
    const handleViewDetails = () => {
        // Decide which context's setSelectedPaper to use or if they should be merged/coordinated
        // For now, let's assume PaperContext is primarily for the detail view
        setSelectedPaperPaper({ // Using PaperContext's setter
            id: display_id, 
            source: 'PMC', 
            title: pm_data.title,
            // Pass other necessary data
            pm_data: pm_data, // Pass full pm_data
            associated_ctg_studies: associated_ctg_studies, // Pass linked studies
        });
        navigate(`/paper/${display_id}?source=PMC`); 
    };

    const handleSelect = () => {
        // This function seems to use SearchContext's setSelectedPaper.
        // Ensure this is the intended behavior vs. handleViewDetails using PaperContext.
        // If SearchContext's selectedPaper is for a different purpose (e.g. highlighting in list), this is fine.
        if (setSelectedPaperSearch) {
            setSelectedPaperSearch(paper); // Using SearchContext's setter
        }
    };

    // Abstract display: Ensure it's treated as a string
    const abstractText = pm_data.abstract || 'No abstract available.';
    // const formattedAbstract = typeof abstractText === 'string' 
    //     ? abstractText.split('\n').map((line, idx) => <p key={idx} className="abstract-line">{line}</p>)
    //     : 'Abstract format not recognized.'; // Fallback if abstract isn't a simple string

    // Consider truncating abstract for display here if it's too long
    const displayAbstract = typeof abstractText === 'string' 
        ? (abstractText.length > 300 ? abstractText.substring(0, 300) + "..." : abstractText)
        : "Abstract not available or in unexpected format.";


    return (
        <Card className="mb-3 result-card pm-card shadow-sm" onClick={handleSelect}>
            <Card.Header className="d-flex justify-content-between align-items-center result-card-header">
                <Badge bg="primary" className="source-badge">PubMed/PMC</Badge>
                {pm_data.pmcid && <small className="text-muted">PMCID: {pm_data.pmcid}</small>}
            </Card.Header>
            <Card.Body>
                <Card.Title className="result-title">{pm_data.title || 'No Title'}</Card.Title>
                {/* ... Authors, Journal, PubDate ... */}
                <div className="result-meta">
                    {pm_data.authors && pm_data.authors.length > 0 && (
                        <p className="authors"><strong>Authors:</strong> {pm_data.authors.slice(0, 3).join(', ')}{pm_data.authors.length > 3 ? ', et al.' : ''}</p>
                    )}
                    {pm_data.journal && <p className="journal"><strong>Journal:</strong> {pm_data.journal}</p>}
                    {pm_data.pubDate && <p className="pub-date"><strong>Date:</strong> {pm_data.pubDate}</p>}
                </div>

                {/* Abstract Display */}
                <div className="abstract-preview mt-2">
                    <strong>Abstract:</strong>
                    <div style={{ whiteSpace: 'pre-line' }}> 
                        {displayAbstract}
                    </div>
                </div>

                {associated_ctg_studies && associated_ctg_studies.length > 0 && (
                    <div className="mt-2">
                        <strong>Linked Clinical Trials ({associated_ctg_studies.length}):</strong>
                        <ul>
                            {associated_ctg_studies.slice(0, 2).map(ctg_study => ( 
                                <li key={ctg_study.protocolSection.identificationModule.nctId}>
                                    {ctg_study.protocolSection.identificationModule.nctId}: {ctg_study.protocolSection.identificationModule.briefTitle}
                                </li>
                            ))}
                            {associated_ctg_studies.length > 2 && <li>...and {associated_ctg_studies.length - 2} more.</li>}
                        </ul>
                    </div>
                )}
            </Card.Body>
            <Card.Footer className="text-end">
                <Button variant="outline-primary" size="sm" onClick={(e) => { e.stopPropagation(); handleViewDetails(); }}>
                    View Details
                </Button>
            </Card.Footer>
        </Card>
    );
}

export default ResultCardPM;