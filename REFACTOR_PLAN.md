## Styles and Defintions

reference example on how to modularize
shared/{components|styles}
after screens are done, move all components but chart/LightweightChartBridge to modals/

for each screen and component (except LightweightChartBridge) in screens/ and components/
    DO NOT CHANGE THE ORIGINAL STYLING YOU FUCKING CLANKER

    determine all components and subcomponents in the page that can be modularized

    create sub directory for page specific components (components that don't appear anywhere else)

    if component being added to sub directory is already in another components page specific sub directory, then move it into the shared components folder
        verify this implementation works. if it doesnt and a small tweak needs to be made, make the change and ensure it is not a breaking change

    make a new associated styles for each component, but do not delete the original styles file

    All helper functions should stay in <page>.tsx initially

    document in COMPONENTS.md what the component is, what page its on, what input it takes, what styles its using (all of the CSS), etc

### Example of modularity
For example the <PanelSelector> in home is
<filterContaienr>
    <panelSelector>
        {list of options}
    <panelSelector>
<filterContaienr>

each option is
<panelButton>
    <Text>
        Value
    </Text>
<panelbutton>
This can likely be in a shared folder, as other pages will likey use this

<HomeContent> is (with some logic to check which container to display, whatever is the most efficient and cleanest way to do this in terms of JS rendering)
<GestureDetetor>
    <PanelSelector>
    <ScrollView>
        <BalanceContent displayBalance={displayBalance} includeDepositButton={true}>
        <LoadingContainer>
        <ErrorContainer>
        <PerpPositionsContainer positions={perpPositions}>
        <SpotPositionsContainer positions={spotPositions}>
        <StakingPositionContainer positions={stakingPositions}>
        <StarredPerpsContainer tickers={starredPerpsTickers}>
        <StarredSpotContainer tickers={spotPerpsTickers}>
    <ScrollView>
<GestureDetetor>

<BalanceContent> is
<BalanceContainer>
    <AnimatedBalanceAmount>
        Balance
    <AnimatedBalanceAmount>
    {if includeDepositButton}
    <DepositTextButton>
<BalanceContainer>s

<PerpPositionsContainer>, <SpotPositionsContainer>, <StakingPositionContainer>, all extend from a parent class <PositionContainer>

PositionContainer {
    positions,
    label,
    displayPositions() // for each position { displayCell(position) }
}
PerpPositionsContainer implementation of displayPositions() will use <PerpTickerCell displayTPSL={false}>, PerpPositionsContainer will use <SpotTickerCell>
additionally perppositonscontainer will habve the close all button

Home is
<SafeView>
    <PanelSelector>
    <HomeContent>
<SafeView>

Start with screens/

By the end, screens should look like

shared/
--| components/ // can be imported from anywhere
--|--| panel_selector/
--|--|--| PanelSelector.tsx // should be the only thing directly imported from this folder
--|--|--| components/ // scope should be limited to panel_selector, ideally not directly imported outside of panel_selector/*
--|--|--| styles/ // scope should be limited to panel_selector, ideally not directly imported outside of panel_selector/*
--| styles/ // can be imported from anywhere, should not import from anywhere
--|--| shared.styles.tsx
modals/
--| close_position/
--|--| ClosePositionModal.tsx // should be the only thing directly imported from this folder
--|--| components/ // scope should be limited to close_position, ideally not directly imported outside of close_position/*
--|--|--| {other subcomponents}
--|--| styles/ // scope should be limited to close_position, ideally not directly imported outside of close_position/*
--|--|--| shared.styles.tsx
--|--|--| ClosePositionModal.styles.tsx
--| delegate/
screens/
--| home_screen/
--|--| HomeScreen.tsx // should be the only thing directly imported from this folder
--|--| components/ // scope should be limited to home_screen, ideally not directly imported outside of home_screen/*
--|--|--| BalanceContent.tsx
--|--|--| {other subcomponents}
--|--| styles/
--|--|--| shared.styles.tsx // scope should be limited to home_screen, ideally not directly imported outside of home_screen/*
--|--|--| BalanceContent.styles.tsx
--|--|--| {other subcomponents styles}
--| connect_screen/
--| {other screens}


After this, styles:
    for each component/modal
        find all duplicate styles, and put in shared.style.ts file in that comppnent/modal folder
    for each shared.style.ts file
         find all duplicate styles, and put in shared/shared.style.ts file

After this util funcs

After this constants

After this cleanup comments

After this unit tests