# Development Plan Index

This index outlines the development steps for the Badass TCG project. Each file represents a distinct phase of development.

- **[DEVPLAN_01_Project_Setup.md](DEVPLAN_01_Project_Setup.md)**: Initial project structure, dependencies, and basic server setup.
- **[DEVPLAN_02_Core_Data_Models.md](DEVPLAN_02_Core_Data_Models.md)**: Defining core data structures (Card, Player, GameState) and database schema.
- **[DEVPLAN_03_Game_Loop_Engine.md](DEVPLAN_03_Game_Loop_Engine.md)**: Implementing the server-side turn structure and phase transitions.
- **[DEVPLAN_04_Resource_System.md](DEVPLAN_04_Resource_System.md)**: Implementing Mana generation, tracking, and spending.
- **[DEVPLAN_05_Action_Play_Card.md](DEVPLAN_05_Action_Play_Card.md)**: Implementing the core 'Play Card' action and related state changes.
- **[DEVPLAN_06_Combat_System.md](DEVPLAN_06_Combat_System.md)**: Implementing the basic combat phase steps (Attack, Block, Damage). (In Progress - Implementing WebSocket events)
- **[DEVPLAN_07_Stack_Implementation.md](DEVPLAN_07_Stack_Implementation.md)**: Implementing the stack for spell/ability resolution and priority passing.
- **[DEVPLAN_08_Basic_Keywords.md](DEVPLAN_08_Basic_Keywords.md)**: Implementing foundational keywords (Haste, Flying, Vigilance).
- **[DEVPLAN_09_UI_Board_Layout.md](DEVPLAN_09_UI_Board_Layout.md)**: Setting up the basic React UI structure for the game board.
- **[DEVPLAN_10_UI_Card_Rendering.md](DEVPLAN_10_UI_Card_Rendering.md)**: Implementing basic card display in the UI.
- **[DEVPLAN_11_Networking_State_Sync.md](DEVPLAN_11_Networking_State_Sync.md)**: Setting up WebSocket communication for real-time state synchronization.
- **[DEVPLAN_12_Deck_Management.md](DEVPLAN_12_Deck_Management.md)**: Implementing deck loading and basic validation.
- **[DEVPLAN_13_Win_Loss_Conditions.md](DEVPLAN_13_Win_Loss_Conditions.md)**: Implementing core win/loss condition checks (Life, Deck Out).
- **[DEVPLAN_14_Energy_System.md](DEVPLAN_14_Energy_System.md)**: Implementing the secondary Energy resource system.
- **[DEVPLAN_15_Testing_Refinement.md](DEVPLAN_15_Testing_Refinement.md)**: Initial testing phase and refinement of core systems.
