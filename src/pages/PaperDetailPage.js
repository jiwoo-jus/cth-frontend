// filepath: /Users/jiwoo/WorkSpace/ClinicalTrialsHub/clinical_trials_hub_web/cth-frontend1/src/pages/PaperDetailPage.js
import React, { useContext, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { PaperContext } from '../contexts/PaperContext'; // Adjust path if necessary

function PaperDetailPage() {
    const { id } = useParams(); // Gets 'PMC12061230' from the URL
    const location = useLocation(); // To access query parameters like ?source=PMC
    const { selectedPaper, setSelectedPaper } = useContext(PaperContext);

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const source = queryParams.get('source');
        console.log('PaperDetailPage loaded for ID:', id, 'Source:', source);

        // If selectedPaper is not set or doesn't match the ID,
        // you might want to fetch paper details here based on 'id' and 'source'.
        // For now, we assume PaperContext was populated by ResultCardPM.
        if (!selectedPaper || selectedPaper.id !== id) {
            console.warn(`PaperDetailPage: selectedPaper in context does not match URL ID (${id}). Consider fetching.`);
            // Example: fetchPaperDetails(id, source).then(data => setSelectedPaper(data));
        }
    }, [id, location.search, selectedPaper, setSelectedPaper]);

    if (!selectedPaper || selectedPaper.id !== id) {
        // Show loading state or a message if paper data isn't ready
        // or if context didn't have the right paper (e.g., direct navigation to this URL)
        return <div>Loading paper details for {id}... If this takes too long, the paper might not have been selected or found.</div>;
    }

    // Destructure pm_data safely after ensuring selectedPaper and selectedPaper.pm_data exist
    const pm_data = selectedPaper.pm_data || {};
    const associated_ctg_studies = selectedPaper.associated_ctg_studies || [];

    return (
        <div className="container mt-4">
            <h1>{pm_data.title || 'Paper Title Not Available'}</h1>
            <p><strong>ID:</strong> {selectedPaper.id}</p>
            <p><strong>Source:</strong> {selectedPaper.source}</p>
            
            {pm_data.authors && pm_data.authors.length > 0 && (
                <p><strong>Authors:</strong> {pm_data.authors.join(', ')}</p>
            )}
            {pm_data.journal && <p><strong>Journal:</strong> {pm_data.journal}</p>}
            {pm_data.pubDate && <p><strong>Publication Date:</strong> {pm_data.pubDate}</p>}
            
            <h2>Abstract</h2>
            <div style={{ whiteSpace: 'pre-line' }}>
                {pm_data.abstract || 'No abstract available.'}
            </div>

            {associated_ctg_studies.length > 0 && (
                <>
                    <h2 className="mt-3">Associated Clinical Trials</h2>
                    <ul>
                        {associated_ctg_studies.map(study => (
                            <li key={study.protocolSection?.identificationModule?.nctId || study.nct_id}>
                                {study.protocolSection?.identificationModule?.nctId || study.nct_id}: {study.protocolSection?.identificationModule?.briefTitle || 'N/A'}
                            </li>
                        ))}
                    </ul>
                </>
            )}
            {/* Add more details as needed */}
        </div>
    );
}

export default PaperDetailPage;