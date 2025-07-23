-- Este script debe ejecutarse manualmente en la consola de Supabase
-- para actualizar las zonas con los datos correctos de Rosario

-- Eliminar zonas existentes
DELETE FROM public.zones;

-- Insertar zonas correctas de Rosario
INSERT INTO public.zones (name, description, postal_codes, neighborhoods, transport_cost, is_active) VALUES
  (
    'Rosario Centro', 
    'Centro de Rosario y barrios céntricos',
    ARRAY['2000', '2001', '2002', '2003', '2004'],
    ARRAY[
      'centro', 'microcentro', 'pichincha', 'pichincha norte', 'pichincha sur',
      'republica de la sexta', 'republica de la sexta norte', 'republica de la sexta sur',
      'san martin', 'san martin norte', 'san martin sur', 'san nicolas',
      'catamarca', 'catamarca norte', 'catamarca sur', 'san juan', 'san juan norte',
      'san juan sur', 'santa fe', 'santa fe norte', 'santa fe sur'
    ],
    5000.00,
    true
  ),
  (
    'Rosario Norte', 
    'Zona norte de Rosario',
    ARRAY['2005', '2006', '2007', '2008'],
    ARRAY[
      'nuevo alberdi', 'alberdi', 'alberdi norte', 'alberdi sur',
      'la flordida', 'flordida', 'la flordida norte', 'la flordida sur',
      'triangulo', 'triangulo norte', 'triangulo sur', 'triangulo este',
      'triangulo oeste', 'triangulo central', 'triangulo norte este',
      'triangulo norte oeste', 'triangulo sur este', 'triangulo sur oeste',
      'la guardia', 'guardia', 'la guardia norte', 'la guardia sur',
      'la guardia este', 'la guardia oeste', 'la guardia central'
    ],
    6000.00,
    true
  ),
  (
    gen_random_uuid(), 
    'Rosario Sur', 
    'Zona sur de Rosario',
    ARRAY['2009', '2010', '2011', '2012'],
    ARRAY[
      'parque españa', 'parque espana', 'parque españa norte', 'parque españa sur',
      'parque españa este', 'parque españa oeste', 'parque españa central',
      'parque independencia', 'parque independencia norte', 'parque independencia sur',
      'parque independencia este', 'parque independencia oeste', 'parque independencia central',
      'parque urquiza', 'parque urquiza norte', 'parque urquiza sur',
      'parque urquiza este', 'parque urquiza oeste', 'parque urquiza central',
      'parque de la costa', 'parque de la costa norte', 'parque de la costa sur',
      'parque de la costa este', 'parque de la costa oeste', 'parque de la costa central'
    ],
    6000.00,
    true
  ),
  (
    gen_random_uuid(), 
    'Rosario Oeste', 
    'Zona oeste de Rosario',
    ARRAY['2013', '2014', '2015', '2016'],
    ARRAY[
      'fisherton', 'fisherton norte', 'fisherton sur', 'fisherton este',
      'fisherton oeste', 'fisherton central', 'fisherton norte este',
      'fisherton norte oeste', 'fisherton sur este', 'fisherton sur oeste',
      'arroyito', 'arroyito norte', 'arroyito sur', 'arroyito este',
      'arroyito oeste', 'arroyito central', 'arroyito norte este',
      'arroyito norte oeste', 'arroyito sur este', 'arroyito sur oeste',
      'ludueña', 'ludueña norte', 'ludueña sur', 'ludueña este',
      'ludueña oeste', 'ludueña central', 'ludueña norte este',
      'ludueña norte oeste', 'ludueña sur este', 'ludueña sur oeste'
    ],
    7000.00,
    true
  ),
  (
    gen_random_uuid(), 
    'Rosario Este', 
    'Zona este de Rosario',
    ARRAY['2017', '2018', '2019', '2020'],
    ARRAY[
      'puerto norte', 'puerto norte norte', 'puerto norte sur', 'puerto norte este',
      'puerto norte oeste', 'puerto norte central', 'puerto norte norte este',
      'puerto norte norte oeste', 'puerto norte sur este', 'puerto norte sur oeste',
      'puerto sur', 'puerto sur norte', 'puerto sur sur', 'puerto sur este',
      'puerto sur oeste', 'puerto sur central', 'puerto sur norte este',
      'puerto sur norte oeste', 'puerto sur sur este', 'puerto sur sur oeste',
      'puerto central', 'puerto central norte', 'puerto central sur', 'puerto central este',
      'puerto central oeste', 'puerto central central', 'puerto central norte este',
      'puerto central norte oeste', 'puerto central sur este', 'puerto central sur oeste'
    ],
    7000.00,
    true
  ),
  (
    gen_random_uuid(), 
    'Alrededores Cercanos', 
    'Localidades cercanas a Rosario',
    ARRAY['2101', '2102', '2103', '2104', '2105', '2106', '2107', '2108', '2109', '2110'],
    ARRAY[
      'funes', 'funes norte', 'funes sur', 'funes este', 'funes oeste', 'funes central',
      'roldan', 'roldan norte', 'roldan sur', 'roldan este', 'roldan oeste', 'roldan central',
      'san lorenzo', 'san lorenzo norte', 'san lorenzo sur', 'san lorenzo este', 'san lorenzo oeste', 'san lorenzo central',
      'capitán bermúdez', 'capitan bermudez', 'capitán bermúdez norte', 'capitán bermúdez sur', 'capitán bermúdez este', 'capitán bermúdez oeste', 'capitán bermúdez central',
      'granadero baigorria', 'granadero baigorria norte', 'granadero baigorria sur', 'granadero baigorria este', 'granadero baigorria oeste', 'granadero baigorria central',
      'pérez', 'perez', 'pérez norte', 'pérez sur', 'pérez este', 'pérez oeste', 'pérez central',
      'zavalla', 'zavalla norte', 'zavalla sur', 'zavalla este', 'zavalla oeste', 'zavalla central',
      'alvear', 'alvear norte', 'alvear sur', 'alvear este', 'alvear oeste', 'alvear central',
      'coronel domínguez', 'coronel dominguez', 'coronel domínguez norte', 'coronel domínguez sur', 'coronel domínguez este', 'coronel domínguez oeste', 'coronel domínguez central',
      'acebal', 'acebal norte', 'acebal sur', 'acebal este', 'acebal oeste', 'acebal central',
      'casilda', 'casilda norte', 'casilda sur', 'casilda este', 'casilda oeste', 'casilda central'
    ],
    8000.00,
    true
  );
