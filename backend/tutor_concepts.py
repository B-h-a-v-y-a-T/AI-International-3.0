from typing import List, Dict

# Example Knowledge Graph mapping concepts to prerequisites
# The key depends on the items in the list.
CONCEPT_GRAPH = {
    "calculus": ["functions"],
    "functions": ["algebra"],
    "algebra": []
}

def find_weak_concepts(performance: Dict[str, float]) -> List[str]:
    """
    Identifies the weakest concept based on scores and traces backward
    in the concept graph to generate a prerequisite chain.
    """
    if not performance:
        return []

    # Identify concept with the lowest score
    weakest_concept = min(performance, key=performance.get)
    
    # Trace backward in the graph
    chain = []
    current = weakest_concept
    
    while current:
        chain.append(current)
        # Pull the prerequisite if it exists
        prereqs = CONCEPT_GRAPH.get(current, [])
        if prereqs:
            # Picking the immediate direct prerequisite for simplied chain
            current = prereqs[0]
        else:
            break
            
    return chain
