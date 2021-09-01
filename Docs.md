# FRC Game Sim Documentation
# Index
### Units
**ft**: feet  
**s**: seconds  
**pts**: points  


### Locations
**HOME**: Robot Starting Position  
**C1/C2**: Item Colection Locations  
**D1a/D2a**: Item A Deposits  
**D1b/D2b**: Item B Deposits

####Location Tables
**rows**: Origin Location  
**column**: Destination Location

### Cells
**X**: Unnecessary Value  
**OP**: Optional; Can be Derived

# Game Field

### Distances (ft):
|          | HOME | C1  | C2  | D1a  | D2a  | D1b  | D2b  |
| --------:|:----:|:---:|:---:|:----:|:----:|:----:|:----:|
| **HOME** |   0  |     |     |  X   |  X   |  X   |  X   |    
| **C1**   |   X  |  0  |  X  |      |      |      |      |
| **C2**   |   X  |  X  |  0  |      |      |      |      |
| **D1a**  |   X  |  OP |  OP |  0   |  X   |      |      |
| **D2a**  |   X  |  OP |  OP |  X   |  0   |      |      |
| **D1b**  |   X  |  OP |  OP |  OP  |  OP  |  0   |  X   |
| **D2b**  |   X  |  OP |  OP |  OP  |  OP  |  X   |  0   |

### Time Penalty (s):
|          | HOME | C1  | C2  | D1a  | D2a  | D1b  | D2b  |
| --------:|:----:|:---:|:---:|:----:|:----:|:----:|:----:|
| **HOME** |   0  |     |     |  X   |  X   |  X   |  X   |    
| **C1**   |   X  |  0  |  X  |      |      |      |      |
| **C2**   |   X  |  X  |  0  |      |      |      |      |
| **D1a**  |   X  |  OP |  OP |  0   |  X   |      |      |
| **D2a**  |   X  |  OP |  OP |  X   |  0   |      |      |
| **D1b**  |   X  |  OP |  OP |  OP  |  OP  |  0   |  X   |
| **D2b**  |   X  |  OP |  OP |  OP  |  OP  |  X   |  0   |

**Item A Count**: `Integer`  
**Item B Count**: `Integer`

# Robot


# Derived Values

### Travel Time (s):
`[Distances] / [Movement Speed] + [Time Penalty]`
