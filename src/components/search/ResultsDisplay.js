import React from 'react';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import ResultCardPM from './cards/ResultCardPM';
import ResultCardCTG from './cards/ResultCardCTG';
// import GenericResultCard from './cards/GenericResultCard'; // If you have a fallback

import './ResultsDisplay.css'; // Make sure you have some CSS for transitions

function ResultsDisplay({ results, onResultSelect }) {
    if (!results || results.length === 0) {
        // This message is handled in SearchPage.js, but good to have a fallback
        // return <div className="no-results-placeholder p-5 text-center">No results to display.</div>;
        return null; // Or a more specific placeholder if SearchPage doesn't cover it
    }

    // console.log("Results in ResultsDisplay:", results);

    return (
        <div className="results-display-container container-fluid"> {/* Added container-fluid for better layout potentially */}
            <TransitionGroup component="div" className="row"> {/* Using row for Bootstrap grid if cards are cols */}
                {results.map((item, index) => {
                    // console.log(`Item at index ${index}:`, item);
                    
                    // Use item.display_id as it seems to be the unique identifier from your logs
                    const key = `${item.card_type || 'unknown'}-${item.display_id || index}`;

                    let cardComponent = null;
                    // Corrected: Check item.card_type instead of item.source
                    if (item.card_type === 'PMC' || item.card_type === 'PM') { 
                        cardComponent = <ResultCardPM paper={item} onSelect={onResultSelect} />;
                    } else if (item.card_type === 'CTG') {
                        // Pass item as 'item' to match ResultCardCTG's expected prop
                        cardComponent = <ResultCardCTG item={item} onSelect={onResultSelect} />; 
                    } else {
                        console.warn("Unknown item card_type or missing card_type:", item);
                        // cardComponent = <GenericResultCard item={item} onSelect={onResultSelect} />;
                    }

                    // Wrap cardComponent in a column div if using Bootstrap grid
                    return cardComponent ? (
                        <CSSTransition key={key} timeout={500} classNames="result-item">
                            <div className="col-12 mb-3"> {/* Example: full width column, adjust as needed */}
                                {cardComponent}
                            </div>
                        </CSSTransition>
                    ) : null;
                })}
            </TransitionGroup>
        </div>
    );
}

export default ResultsDisplay;