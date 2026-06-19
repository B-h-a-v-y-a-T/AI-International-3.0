# data.py

topic_graph = {

    # 📐 CALCULUS
    "integration": "differentiation",
    "differentiation": "limits",
    "limits": "algebra",

    # 🎲 COMBINATORICS
    "permutation": "factorial",
    "combination": "permutation",
    "probability": "combination",
    "factorial": "basic_arithmetic",

    # 📊 ALGEBRA EXTENSIONS
    "matrices": "algebra",
    "vectors": "algebra",
    "algebra": "basic_arithmetic",
    "basic_arithmetic": None,

    # 🧪 ORGANIC CHEMISTRY
    "reaction_mechanisms": "organic_reactions",
    "organic_reactions": "functional_groups",
    "functional_groups": "hydrocarbons",
    "hydrocarbons": "alkanes",
    "alkanes": None,

    # ⚗️ PHYSICAL CHEMISTRY
    "kinetics": "equilibrium",
    "equilibrium": "thermodynamics",
    "thermodynamics": "mole_concept",
    "mole_concept": None,

    # 🧪 INORGANIC CHEMISTRY
    "coordination_compounds": "chemical_bonding",
    "chemical_bonding": "periodic_table",
    "periodic_table": None,

    # 🤖 AI / ML
    "deep_learning": "neural_networks",
    "neural_networks": "linear_algebra",
    "linear_algebra": "basic_math",
    "basic_math": None,

    # 📊 DATA SCIENCE
    "model_evaluation": "statistics",
    "statistics": "probability"
}