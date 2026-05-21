# House Systems

## Header
A house system is the method by which the ecliptic (the zodiac circle) is divided into the twelve houses. Different systems use different geometric methods and produce different cusps. The principal systems in current use are Whole Sign, Placidus, Koch, Equal, Porphyry, Regiomontanus, and Campanus.

## Core Meaning
The system that fits the question. The house cusps locate the rooms in which the planets do their work — but different systems will sometimes place a planet in different houses. Modern practice debates fiercely; traditional practice (Hellenistic, Indian, and Renaissance) most often used Whole Sign for natal work and Regiomontanus or Placidus for horary. Semar uses Whole Sign for the natal chart.

## Whole Sign
The oldest house system, used in Hellenistic Greek astrology and in classical Indian astrology. The sign on the Ascendant becomes the entire first house; the next sign is the entire second house; and so on. Cusps are at 0° of each sign. The Midheaven is calculated separately and floats among the houses (often falling in the ninth, tenth, or eleventh) rather than being the tenth-house cusp.

Whole Sign's advantages: simple, mathematically robust at all latitudes (including the poles, where quadrant systems fail), aligns sign and house cleanly. Disadvantages: a planet at 29° Leo and a planet at 1° Virgo are in different houses even if they are degrees apart in the sky.

## Placidus
The most popular system in twentieth-century Western astrology. Houses are divided by the diurnal motion of degrees of the ecliptic across the meridian. Cusps fall at irregular degree positions; the MC is always the tenth-house cusp; the Ascendant always the first.

Placidus's advantages: smooth and intuitive at mid-latitudes; angular-strength readings are precise. Disadvantages: distortion at high latitudes (some houses become extremely large, others small), and breaks down entirely above the Arctic Circle.

## Other Systems
**Equal house** divides the ecliptic into twelve 30° houses starting from the Ascendant. **Porphyry** divides the ecliptic between MC and Ascendant into three equal arcs and does the same for the other two quadrants. **Koch** is a quadrant system favoured in mid-twentieth-century German astrology. **Regiomontanus** is a great-circle quadrant system favoured in horary tradition. **Campanus** divides the prime vertical.

## In a Chart
For natal work, the choice of house system can change which house a planet falls in for a small percentage of charts (typically when a planet is near a cusp). The figure of an astrologer's lineage often dictates the choice — Hellenistic revivalists prefer Whole Sign; mid-century textbook practice prefers Placidus; horary practitioners may use Regiomontanus.

Semar's `packages/astrology` implements Whole Sign by default. Adding additional systems is straightforward when a precise quadrant calculation matters.

## Keywords
Whole Sign, Placidus, Koch, Equal, Porphyry, Regiomontanus, Campanus, the house cusp, the angular houses

## Sources
- Demetra George, *Ancient Astrology in Theory and Practice* (Rubedo, 2019).
- Deborah Houlding, *The Houses: Temples of the Sky* (Wessex, 1998).
- Robert Hand, *Whole Sign Houses* (ARHAT, 2000).
