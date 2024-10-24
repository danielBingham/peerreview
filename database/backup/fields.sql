/**
 * Iinitialize the fields table with the base set of academic fields we want to
 * have available at launch.  We're going to base these off of the outlines on
 * wikipedia, however, it's going to be messy because those outlines aren't
 * even self consistent.
 * 
 * Once we launch, these will evolve through suggested changes by the user
 * community.
 */

INSERT INTO fields (name, type, description, created_date, updated_date)
    VALUES
        ('physics', 'physics', 'Physics is the natural science that studies matter, its fundamental constituents, its motion and behavior through space and time, and the related entities of energy and force. Physics is one of the most fundamental scientific disciplines, with its main goal being to understand how the universe behaves. A scientist who specializes in the field of physics is called a physicist. [Read more.](https://en.wikipedia.org/wiki/Physics)', now(), now()), 
        ('chemistry', 'chemistry', 'Chemistry is the scientific study of the properties and behavior of matter. It is a natural science that covers the elements that make up matter to the compounds composed of atoms, molecules and ions: their composition, structure, properties, behavior and the changes they undergo during a reaction with other substances.', now(), now()),
        ('biology', 'biology', 'Biology is the scientific study of life. It is a natural science with a broad scope but has several unifying themes that tie it together as a single, coherent field. For instance, all organisms are made up of cells that process hereditary information encoded in genes, which can be transmitted to future generations. Another major theme is evolution, which explains the unity and diversity of life. Energy processing is also important to life as it allows organisms to move, grow, and reproduce. Finally, all organisms are able to regulate their own internal environments. [Read more.](https://en.wikipedia.org/wiki/Biology)', now(), now()),
        ('earth-science', 'earth-science', 'Earth science or geoscience includes all fields of natural science related to the planet Earth. This is a branch of science dealing with the physical, chemical, and biological complex constitutions and synergistic linkages of Earth''s four spheres, namely biosphere, hydrosphere, atmosphere, and geosphere. Earth science can be considered to be a branch of planetary science, but with a much older history. Earth science encompasses four main branches of study, the lithosphere, the hydrosphere, the atmosphere, and the biosphere, each of which is further broken down into more specialized fields.',  now(), now()),
        ('space-science', 'space-science', 'Space science encompasses all of the scientific disciplines that involve space exploration and study natural phenomena and physical bodies occurring in outer space, such as space medicine and astrobiology.', now(), now()),
        ('anthropology', 'anthropology', 'Anthropology is the scientific study of humanity, concerned with human behavior, human biology, cultures, societies, and linguistics, in both the present and past, including past human species. Social anthropology studies patterns of behaviour, while cultural anthropology studies cultural meaning, including norms and values. A portmanteau sociocultural anthropology is commonly used today. Linguistic anthropology studies how language influences social life. Biological or physical anthropology studies the biological development of humans. [Read more.](https://en.wikipedia.org/wiki/Anthropology)', now(), now());

INSERT INTO fields (name, type, created_date, updated_date) 
    VALUES 
        ('archaeology', 'archaeology', now(), now()), /* 7 */ 
        ('economics', 'economics', now(), now()), /* 8 */ 
        ('geography', 'geography', now(), now()), /* 9 */
        ('political-science', 'political-science', now(), now()), /* 10 */
        ('psychology', 'psychology', now(), now()), /* 11 */
        ('sociology', 'sociology', now(), now()), /* 12 */
        ('social-work', 'social-work', now(), now()), /* 13 */
        ('computer-science', 'computer-science', now(), now()), /* 14 */
        ('mathematics', 'mathematics', now(), now()), /* 15 */
        ('performing-arts', 'performing-arts', now(), now()),
        ('visual-arts', 'visual-arts', now(), now()),
        ('history', 'history', now(), now()),
        ('languages-and-literature', 'languages-and-literature', now(), now()),
        ('law', 'law', now(), now()),
        ('philosophy', 'philosophy', now(), now()),
        ('theology', 'theology', now(), now()),
        ('agriculture', 'agriculture', now(), now()),
        ('architecture', 'architecture', now(), now()),
        ('business', 'business', now(), now()),
        ('education', 'education', now(), now()),
        ('engineering', 'engineering', now(), now()),
        ('environmental-studies', 'environmental-studies', now(), now()),
        ('consumer-science', 'consumer-science', now(), now()),
        ('recreation', 'recreation', now(), now()),
        ('media-studies', 'media-studies', now(), now()),
        ('law', 'law', now(), now()),
        ('library-science', 'library-science', now(), now()),
        ('medicine', 'medicine', now(), now()),
        ('military-science', 'military-science', now(), now()),
        ('public-administration', 'public-administration', now(), now()),
        ('transportation', 'transportation', now(), now()),

/******************************************************************************
 * Subfields of Physics 
 *****************************************************************************/
        ('acoustics', 'physics', now(), now()),
        ('applied-physics', 'physics', now(), now()),
        ('astrophysics', 'physics-space-science', now(), now()),
            ('compact-objects', 'physics-space-science', now(), now()),
            ('physical-cosmology', 'physics-space-science', now(), now()),
            ('quantum-cosmology', 'physics-space-science', now(), now()),
            ('computational-astrophysics', 'physics-space-science', now(), now()),
            ('galactic-astronomy', 'physics-space-science', now(), now()),
            ('high-energy-astrophysics', 'physics-space-science', now(), now()),
            ('interstellar-astrophysics', 'physics-space-science', now(), now()),
            ('extragalactic-astronomy', 'physics-space-science', now(), now()),
            ('stellar-astronomy', 'physics-space-science', now(), now()),
            ('plasma-astrophysics', 'physics-space-science', now(), now()),
            ('relativistic-astrophysics', 'physics-space-science', now(), now()),
            ('plasma-astrophysics', 'physics-space-science', now(), now()),
            ('solar-physics', 'physics-space-science', now(), now()),
        ('atmospheric-physics', 'physics', now(), now()),
        ('atomic-molecular-optical-physics', 'physics', now(), now()),
            ('optics', 'physics', now(), now()),
        ('biophysics', 'physics-biology', now(), now()),
            ('biomechanics', 'physics-biology', now(), now()),
            ('neurophysics', 'physics-biology', now(), now()),
            ('polymer-physics', 'physics-biology', now(), now()),
            ('quantum-biology', 'physics-biology', now(), now()),
            ('virophysics', 'physics-biology', now(), now()),
        ('chemical-physics', 'physics-chemistry', now(), now()),
        ('computational-physics', 'physics', now(), now()),
        ('condensed-matter-physics', 'physics', now(), now()),
        ('cryogenics', 'physics', now(), now()),
        ('electricity', 'physics', now(), now()),
        ('electromagnetism', 'physics', now(), now()),
        ('experimental-physics', 'physics', now(), now()),
        ('geophysics', 'physics', now(), now()),
        ('magnetisim', 'physics', now(), now()),
        ('mathematical-physics', 'physics', now(), now()),
        ('mechanics', 'physics', now(), now()),
            ('aerodynamics', 'physics', now(), now()),
            ('biomechanics', 'physics-biology', now(), now()),
            ('classical-mechanics', 'physics', now(), now()),
                ('kinematics', 'physics', now(), now()),
            ('continuum-mechanics', 'physics', now(), now()),
            ('dynamics', 'physics', now(), now()),
            ('fluid-mechanics', 'physics', now(), now()),
                ('fluid-dynamics', 'physics', now(), now()),
                ('fluid-kinematics', 'physics', now(), now()),
                ('fluid-statics', 'physics', now(), now()),
            ('statics', 'physics', now(), now()),
        ('medical-physics', 'physics-medicine', now(), now()),
        ('newtonian-dynamics', 'physics', now(), now()),
        ('nuclear-physics', 'physics', now(), now()),
        ('partical-physics', 'physics', now(), now()),
        ('plasma-physics', 'physics', now(), now()),
        ('quantum-physics', 'physics', now(), now()),
            ('quantum-field-theory', 'physics', now(), now()),
            ('quantum-information-theory', 'physics', now(), now()),
            ('quantum-foundations', 'physics', now(), now()),
        ('quantum-gravity', 'physics', now(), now()),
        ('relativity', 'physics', now(), now()),
            ('general-relativity', 'physics', now(), now()),
            ('special-relativity', 'physics', now(), now()),
        ('solid-mechanics', 'physics', now(), now()),
        ('solid-state-physics', 'physics', now(), now()),
        ('statistical-mechanics', 'physics', now(), now()),
        ('theoretical-physics', 'physics', now(), now()),
        ('thermal-physics', 'physics', now(), now()),
        ('thermodynamics', 'physics', now(), now()),

/******************************************************************************
 * Subfields of Space Science 
 *****************************************************************************/
        ('astronomy', 'space-science', now(), now()),
            ('planetary-science', 'space-science', now(), now()),
                ('atmospheric-science', 'space-science', now(), now()),
                ('exoplanetology', 'space-science', now(), now()),
                ('planet-formation', 'space-science', now(), now()),
                ('magnetospheres', 'space-science', now(), now()),
                ('planetary-surfaces', 'space-science', now(), now()),
                ('planetary-interiors', 'space-science', now(), now()),
                ('small-solar-system-bodies', 'space-science', now(), now()),
            ('astrometry', 'space-science', now(), now()),
            ('observational-astronomy', 'space-science', now(), now()),
                ('radio-astronomy', 'space-science', now(), now()),
                ('submillimeter-astronomy', 'space-science', now(), now()),
                ('infrared-astronomy', 'space-science', now(), now()),
                ('xray-astronomy', 'space-science', now(), now()),
                ('optical-astronomy', 'space-science', now(), now()),
                ('ultraviolet-astronomy', 'space-science', now(), now()),
                ('gramma-ray-astronomy', 'space-science', now(), now()),
                ('cosmic-ray-astronomy', 'space-science', now(), now()),
                ('neutrino-astronomy', 'space-science', now(), now()),
                ('gravitational-wave-astronomy', 'space-science', now(), now()),
            ('astronomical-photometry', 'space-science', now(), now()),
            ('astronomical-spectroscopy', 'space-science', now(), now()),
            
/******************************************************************************
 * Sub-fields of Chemistry 
 *****************************************************************************/
        ('physical-chemistry', 'chemistry', now(), now()),
            ('chemical-kinetics', 'chemistry', now(), now()),
            ('chemical-physics', 'chemistry', now(), now()),
            ('electrochemistry', 'chemistry', now(), now()),
            ('femtochemistry', 'chemistry', now(), now()),
            ('geochemistry', 'chemistry', now(), now()),
            ('photochemistry', 'chemistry', now(), now()),
            ('quantum-chemistry', 'chemistry', now(), now()),
            ('solid-state-chemistry', 'chemistry', now(), now()),
            ('spectroscopy', 'chemistry', now(), now()),
            ('stereochemistry', 'chemistry', now(), now()),
            ('surface-science', 'chemistry', now(), now()),
            ('thermochemistry', 'chemistry', now(), now()),
                ('calorimetry', 'chemistry', now(), now()),
        ('organic-chemistry', 'chemistry', now(), now()),
            ('biochemistry', 'chemistry-biology', now(), now()),
                ('neurochemistry', 'chemistry-biology', now(), now()),
            ('bioorganic-chemistry', 'chemistry-biology', now(), now()),
            ('biophysical-chemistry', 'chemistry-biology', now(), now()),
            ('medicinal-chemistry', 'chemistry', now(), now()),
            ('organometallic-chemistry', 'chemistry', now(), now()),
            ('physical-organic-chemistry', 'chemistry', now(), now()),
            ('polymer-chemistry', 'chemistry', now(), now()),
            ('click-chemistry', 'chemistry', now(), now()),
        ('inorganic-chemistry', 'chemistry', now(), now()),
            ('bioinorganic-chemistry', 'chemistry-biology', now(), now()),
            ('cluster-chemistry', 'chemistry', now(), now()),
            ('materials-chemistry', 'chemistry', now(), now()),
        ('nuclear-chemistry', 'chemistry', now(), now()),
        ('analytical-chemistry', 'chemistry', now(), now()),
        ('astrochemistry', 'chemistry-space-science', now(), now()),
            ('cosmochemistry', 'chemistry-space-science', now(), now()),
        ('computational-chemistry', 'chemistry', now(), now()),
        ('environmental-chemistry', 'chemistry', now(), now()),
        ('green-chemistry', 'chemistry', now(), now()),
        ('supramolecular-chemistry', 'chemistry', now(), now()),
        ('theoretical-chemistry', 'chemistry', now(), now()),
        ('wet-chemistry', 'chemistry', now(), now()),
        ('agrochemistry', 'chemistry', now(), now()),
        ('atmospheric-chemistry', 'chemistry', now(), now()),
        ('chemical-engineering', 'chemistry', now(), now()),
        ('chemical-biology', 'chemistry-biology', now(), now()),
        ('chemo-informatics', 'chemistry', now(), now()),
        ('flow-chemistry', 'chemistry', now(), now()),
        ('immunohistochemistry', 'chemistry', now(), now()),
        ('immunochemistry', 'chemistry', now(), now()),
        ('chemical-oceanography', 'chemistry', now(), now()),
        ('materials-science', 'chemistry', now(), now()),
        ('mathematical-chemistry', 'chemistry-mathematics', now(), now()),
        ('mechanochemistry', 'chemistry', now(), now()),
        ('molecular-mechanics', 'chemistry', now(), now()),
        ('nanotechnology', 'chemistry', now(), now()),
        ('petrochemistry', 'chemistry', now(), now()),
        ('pharmacology', 'chemistry', now(), now()),
        ('phytochemistry', 'chemistry-biology', now(), now()),
        ('radiochemistry', 'chemistry', now(), now()),
        ('sonochemistry', 'chemistry', now(), now()),
        ('synthetic-chemistry', 'chemistry', now(), now()),
        ('toxicology', 'chemistry', now(), now()),

/******************************************************************************
 * Sub-fields of Biology 
 *****************************************************************************/
        ('anatomy', 'biology', now(), now()),
            ('comparative-anatomy', 'biology', now(), now()),
            ('osteology', 'biology', now(), now()),
            ('osteomyoarthrology', 'biology', now(), now()),
            ('viscerology', 'biology', now(), now()),
            ('neuroanatomy', 'biology', now(), now()),
            ('histology', 'biology', now(), now()),
        ('astrobiology', 'biology-space-science', now(), now()),
        ('bioarchaeology', 'biology-archaeology', now(), now()),
        ('biocultural-anthropology', 'biology-anthropology', now(), now()),
        ('biogeography', 'biology-geography', now(), now()),
        ('biolinguistics', 'biology-linguistics', now(), now()),
        ('biological-economics', 'biology-economics', now(), now()),
        ('biotechnology', 'biology', now(), now()),
            ('bioinformatics', 'biology', now(), now()),
            ('bioengineering', 'biology', now(), now()),
            ('synthetic-biology', 'biology', now(), now()),
        ('botany', 'biology', now(), now()),
            ('photobiology', 'biology', now(), now()),
            ('phycology', 'biology', now(), now()),
            ('plant-physiology', 'biology', now(), now()),
        ('cell-biology', 'biology', now(), now()),
        ('chronobiology', 'biology', now(), now()),
            ('dendrochronology', 'biology', now(), now()),
        ('developmental-biology', 'biology', now(), now()),
            ('embryology', 'biology', now(), now()),
            ('geontology', 'biology', now(), now()),
        ('ecology', 'biology', now(), now()),
        ('epidemiology', 'biology', now(), now()),
        ('evolutionary-biology', 'biology', now(), now()),
            ('evolutionary-developmental-biology', 'biology', now(), now()),
            ('paleobiology', 'biology', now(), now()),
            ('paleoanthropology', 'biology', now(), now()),
            ('paleobotany', 'biology', now(), now()),
            ('paleontology', 'biology', now(), now()),
            ('paleopathology', 'biology', now(), now()),
        ('genetics', 'biology', now(), now()),
            ('quantitative-genetics', 'biology', now(), now()),
        ('geobiology', 'biology', now(), now()),
        ('immunology', 'biology', now(), now()),
        ('marine-biology', 'biology', now(), now()),
        ('microbiology', 'biology', now(), now()),
            ('bacteriology', 'biology', now(), now()),
            ('mycology', 'biology', now(), now()),
            ('parasitology', 'biology', now(), now()),
            ('virology', 'biology', now(), now()),
        ('molecular-biology', 'biology', now(), now()),
            ('structural-biology', 'biology', now(), now()),
        ('neuroscience', 'biology', now(), now()),
            ('behavioral-neuroscience', 'biology', now(), now()),
            ('cellular-neuroscience', 'biology', now(), now()),
            ('cognitive-neuroscience', 'biology', now(), now()),
            ('computational-neuroscience', 'biology', now(), now()),
            ('developmental-neuroscience', 'biology', now(), now()),
            ('molecular-neuroscience', 'biology', now(), now()),
            ('neuroendocrinology', 'biology', now(), now()),
            ('neuroethology', 'biology', now(), now()),
            ('neuroimmunology', 'biology', now(), now()),
            ('neuropharmacology', 'biology', now(), now()),
            ('neurophysiology', 'biology', now(), now()),
            ('systems-neuroscience', 'biology', now(), now()),
        ('physiology', 'biology', now(), now()),
            ('endocrinology', 'biology', now(), now()),
            ('oncology', 'biology', now(), now()),
        ('systems-biology', 'biology', now(), now()),
        ('theoretical-biology', 'biology', now(), now());
        /* We'll come back to zoology later.
        ('zoology', 'biology', now(), now()),
            ('arthropodology', 'biology', now(), now()),
                ('acarology', 'biology', now(), now()),
                ('arachnology', 'biology', now(), now()),
                ('entomology', 'biology', now(), now()),
                    ('coleopterology', 'biology', now(), now()),
                    ('lepidopterology', 'biology', now(), now()),
                    ('myrmecology', 'biology', now(), now()),
                ('carcinology', 'biology', now(), now()),
                ('myriapodology', 'biology', now(), now()),
            ('ethology', 'biology', now(), now()),
            ('helminthology', 'biology', now(), now()),
            ('herpetology', 'biology', now(), now()),
                ('batrachology', 'biology', now(), now()),
            ('ichthyology', 'biology', now(), now()),
            ('malacology', 'biology', now(), now()),
                ('teuthology', 'biology', now(), now()),
            ('mammalogy', 'biology', now(), now()),
                ('cetology', 'biology', now(), now()),
                ('primatology', 'biology', now(), now()),
                ('human-biology', 'biology', now(), now()),
                ('biological-anthropology', 'biology', now(), now()),
                    ('human-behavioral-ecology', 'biology', now(), now()),
            ('nematology', 'biology', now(), now()),
            ('ornithology', 'biology', now(), now()); */

        

/**
 * Build the parent relationships. We're going to create a temporary table from the cross join of fields against itself
 * because that's going to make it really easy for us to build the tagging table by just selecting the pairs we want
 * from the cross join table.  We're doing this so that we don't have to manually track IDs when we're entering or
 * modifying the base fieldset.  This might make start up of the database container kind of slow, but we'll gain that time
 * back in the time we spend building the initial field heirarchy.  Initializing the database schema is something we should
 * only have to do once on production, and in the future we'll use database dumps.  So this is a slightly over-engineering
 * optimization for our development time during the alpha phase when we're still manually building the field tree. 
 */

/* Create the table. */
CREATE TABLE fields_cross AS 
    SELECT 
        parent.id AS parent_id, parent.name AS parent_name, child.id AS child_id, child.name AS child_name 
    FROM fields parent CROSS JOIN fields child;

/* Okay, now insert into the relationships table by selecting pairs from the fields_cross table. */

/******************************************************************************
 * Relationships for Physics 
 *****************************************************************************/
insert INTO field_relationships (parent_id, child_id) 
    SELECT parent_id, child_id FROM fields_cross
        WHERE parent_name='physics' 
        AND  ( 
            child_name='acoustics'
            OR child_name='applied-physics'
            OR child_name='astrophysics'
            OR child_name='atmospheric-physics'
            OR child_name='atomic-molecular-optical-physics'
            OR child_name='biophysics'
            OR child_name='chemical-physics'
            OR child_name='computational-physics'
            OR child_name='condensed-matter-physics'
            OR child_name='cryogenics'
            OR child_name='electricity'
            OR child_name='electromagnetism'
            OR child_name='experimental-physics'
            OR child_name='fluid-dynamics'
            OR child_name='geophysics'
            OR child_name='magnetisim'
            OR child_name='mathematical-physics'
            OR child_name='mechanics'
            OR child_name='medical-physics'
            OR child_name='newtonian-dynamics'
            OR child_name='nuclear-physics'
            OR child_name='partical-physics'
            OR child_name='plasma-physics' 
            OR child_name='quantum-physics'
            OR child_name='quantum-gravity'
            OR child_name='relativity'
            OR child_name='solid-mechanics'
            OR child_name='solid-state-physics'
            OR child_name='statistical-mechanics'
            OR child_name='theoretical-physics'
            OR child_name='thermal-physics'
            OR child_name='thermodynamics'
        );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='astrophysics' 
            AND  ( 
                child_name='compact-objects'
                OR child_name='physical-cosmology'
                OR child_name='quantum-cosmology'
                OR child_name='computational-astrophysics'
                OR child_name='galactic-astronomy'
                OR child_name='high-energy-astrophysics'
                OR child_name='interstellar-astrophysics'
                OR child_name='extragalactic-astronomy'
                OR child_name='stellar-astronomy'
                OR child_name='plasma-astrophysics'
                OR child_name='relativistic-astrophysics'
                OR child_name='plasma-astrophysics'
                OR child_name='solar-physics'
            );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='atomic-molecular-optical-physics' 
            AND  ( 
                child_name='optics'
            );

insert INTO field_relationships (parent_id, child_id) 
    SELECT parent_id, child_id FROM fields_cross
        WHERE parent_name='biology' 
        AND  ( 
            child_name='biophysics'
        );
        
    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='biophysics' 
            AND  ( 
                child_name='neurophysics'
                OR child_name='polymer-physics'
                OR child_name='quantum-biology'
                OR child_name='virophysics'
            );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='mechanics' 
            AND  ( 
                child_name='aerodynamics'
                OR child_name='biomechanics'
                OR child_name='classical-mechanics'
                OR child_name='continuum-mechanics'
                OR child_name='dynamics'
                OR child_name='fluid-mechanics'
                OR child_name='statics'
            );


        insert INTO field_relationships (parent_id, child_id) 
            SELECT parent_id, child_id FROM fields_cross
                WHERE parent_name='classical-mechanics' 
                AND  ( 
                    child_name='kinematics'
                );


        insert INTO field_relationships (parent_id, child_id) 
            SELECT parent_id, child_id FROM fields_cross
                WHERE parent_name='fluid-mechanics' 
                AND  ( 
                    child_name='fluid-dynamics'
                    OR child_name='fluid-kinematics'
                    OR child_name='fluid-statics'
                );
        
    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='quantum-physics' 
            AND  ( 
                child_name='quantum-field-theory'
                OR child_name='quantum-information-theory'
                OR child_name='quantum-foundations'
            );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='relativity' 
            AND  ( 
                child_name='general-relativity'
                OR child_name='special-relativity'
            );

/******************************************************************************
 * Relationships for Space Science 
 *****************************************************************************/
insert INTO field_relationships (parent_id, child_id) 
    SELECT parent_id, child_id FROM fields_cross
        WHERE parent_name='space-science' 
        AND  ( 
            child_name='astronomy'
        );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='astronomy' 
            AND  ( 
                child_name='planetary-science'
                OR child_name='astrometry'
                OR child_name='observational-astronomy'
                OR child_name='astronomical-photometry'
                OR child_name='astronomical-spectroscopy'
            );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='planetary-science' 
            AND  ( 
                child_name='atmospheric-science'
                OR child_name='exoplanetology'
                OR child_name='planet-formation'
                OR child_name='magnetospheres'
                OR child_name='planetary-surfaces'
                OR child_name='planetary-interiors'
                OR child_name='small-solar-system-bodies'
            );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='observational-astronomy' 
            AND  ( 
                child_name='radio-astronomy'
                OR child_name='submillimeter-astronomy'
                OR child_name='infrared-astronomy'
                OR child_name='xray-astronomy'
                OR child_name='optical-astronomy'
                OR child_name='ultraviolet-astronomy'
                OR child_name='gramma-ray-astronomy'
                OR child_name='cosmic-ray-astronomy'
                OR child_name='neutrino-astronomy'
                OR child_name='gravitational-wave-astronomy'
            );

/******************************************************************************
 * Relationships for Chemistry
 *****************************************************************************/

insert INTO field_relationships (parent_id, child_id) 
    SELECT parent_id, child_id FROM fields_cross
        WHERE parent_name='chemistry' 
        AND  ( 
            child_name='physical-chemistry'
            OR child_name='organic-chemistry'
            OR child_name='inorganic-chemistry'
            OR child_name='nuclear-chemistry'
            OR child_name='analytical-chemistry'
            OR child_name='astrochemistry'
            OR child_name='computational-chemistry'
            OR child_name='environmental-chemistry'
            OR child_name='green-chemistry'
            OR child_name='supramolecular-chemistry'
            OR child_name='theoretical-chemistry'
            OR child_name='wet-chemistry'
            OR child_name='agrochemistry'
            OR child_name='atmospheric-chemistry'
            OR child_name='chemical-engineering'
            OR child_name='chemical-biology'
            OR child_name='chemo-informatics'
            OR child_name='flow-chemistry'
            OR child_name='immunohistochemistry'
            OR child_name='immunochemistry'
            OR child_name='chemical-oceanography'
            OR child_name='materials-science'
            OR child_name='mathematical-chemistry'
            OR child_name='mechanochemistry'
            OR child_name='molecular-mechanics'
            OR child_name='nanotechnology'
            OR child_name='petrochemistry'
            OR child_name='pharmacology'
            OR child_name='phytochemistry'
            OR child_name='radiochemistry'
            OR child_name='sonochemistry'
            OR child_name='synthetic-chemistry'
            OR child_name='toxicology'
        );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='physical-chemistry' 
            AND  ( 
                child_name='chemical-kinetics'
                OR child_name='chemical-physics'
                OR child_name='electrochemistry'
                OR child_name='femtochemistry'
                OR child_name='geochemistry'
                OR child_name='photochemistry'
                OR child_name='quantum-chemistry'
                OR child_name='solid-state-chemistry'
                OR child_name='spectroscopy'
                OR child_name='stereochemistry'
                OR child_name='surface-science'
                OR child_name='thermochemistry'
            );

        insert INTO field_relationships (parent_id, child_id) 
            SELECT parent_id, child_id FROM fields_cross
                WHERE parent_name='thermochemistry' 
                AND  ( 
                    child_name='calorimetry'
                );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='organic-chemistry' 
            AND  ( 
                child_name='biochemistry'
                OR child_name='bioorganic-chemistry'
                OR child_name='biophysical-chemistry'
                OR child_name='medicinal-chemistry'
                OR child_name='organometallic-chemistry'
                OR child_name='physical-organic-chemistry'
                OR child_name='polymer-chemistry'
                OR child_name='click-chemistry'
            );

        insert INTO field_relationships (parent_id, child_id) 
            SELECT parent_id, child_id FROM fields_cross
                WHERE parent_name='biochemistry' 
                AND  ( 
                    child_name='neurochemistry'
                );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='inorganic-chemistry' 
            AND  ( 
                child_name='bioinorganic-chemistry'
                OR child_name='cluster-chemistry'
                OR child_name='materials-chemistry'
            );

    insert INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='astrochemistry' 
            AND  ( 
                child_name='cosmochemistry'
            );

/******************************************************************************
 * Relationships for Space Science 
 *****************************************************************************/
INSERT INTO field_relationships (parent_id, child_id) 
    SELECT parent_id, child_id FROM fields_cross
        WHERE parent_name='biology' 
        AND  ( 
            child_name='anatomy'
            OR child_name='astrobiology'
            OR child_name='bioarchaeology'
            OR child_name='biocultural-anthropology'
            OR child_name='biogeography'
            OR child_name='biolinguistics'
            OR child_name='biological-economics'
            OR child_name='biotechnology'
            OR child_name='botany'
            OR child_name='cell-biology'
            OR child_name='chronobiology'
            OR child_name='developmental-biology'
            OR child_name='ecology'
            OR child_name='epidemiology'
            OR child_name='evolutionary-biology'
            OR child_name='genetics'
            OR child_name='geobiology'
            OR child_name='immunology'
            OR child_name='marine-biology'
            OR child_name='microbiology'
            OR child_name='molecular-biology'
            OR child_name='neuroscience'
            OR child_name='physiology'
            OR child_name='systems-biology'
            OR child_name='theoretical-biology'
            OR child_name='zoology'
        );

    INSERT INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='anatomy' 
            AND  ( 
                child_name='comparative-anatomy'
                OR child_name='osteology'
                OR child_name='osteomyoarthrology'
                OR child_name='viscerology'
                OR child_name='neuroanatomy'
                OR child_name='histology'
            );

    INSERT INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='biotechnology' 
            AND  ( 
                child_name='bioinformatics'
                OR child_name='bioengineering'
                OR child_name='synthetic-biology'
            );

    INSERT INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='botany' 
            AND  ( 
                child_name='photobiology'
                OR child_name='phycology'
                OR child_name='plant-physiology'
            );

    INSERT INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='chronobiology' 
            AND  ( 
                child_name='dendrochronology'
            );

    INSERT INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='developmental-biology' 
            AND  ( 
                child_name='embryology'
                OR child_name='geontology'
            );

    INSERT INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='evolutionary-biology' 
            AND  ( 
                child_name='evolutionary-developmental-biology'
                OR child_name='paleobiology'
                OR child_name='paleoanthropology'
                OR child_name='paleobotany'
                OR child_name='paleontology'
                OR child_name='paleopathology'
            );

    INSERT INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='genetics' 
            AND  ( 
                child_name='quantitative-genetics'
            );

    INSERT INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='microbiology' 
            AND  ( 
                child_name='bacteriology'
                OR child_name='mycology'
                OR child_name='parasitology'
                OR child_name='virology'
            );

    INSERT INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='molecular-biology' 
            AND  ( 
                child_name='structural-biology'
            );

    INSERT INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='neuroscience' 
            AND  ( 
                child_name='behavioral-neuroscience'
                OR child_name='cellular-neuroscience'
                OR child_name='cognitive-neuroscience'
                OR child_name='computational-neuroscience'
                OR child_name='developmental-neuroscience'
                OR child_name='molecular-neuroscience'
                OR child_name='neuroendocrinology'
                OR child_name='neuroethology'
                OR child_name='neuroimmunology'
                OR child_name='neuropharmacology'
                OR child_name='neurophysiology'
                OR child_name='systems-neuroscience'
            );

    INSERT INTO field_relationships (parent_id, child_id) 
        SELECT parent_id, child_id FROM fields_cross
            WHERE parent_name='physiology' 
            AND  ( 
                child_name='endocrinology'
                OR child_name='oncology'
            );


/* 
 * We only need this table to create the field relationships.  Once we're done
 * with that, remove it to save space. 
 */
DROP TABLE fields_cross;
