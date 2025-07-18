import { Button } from "@/components/ui/button";
import { Image } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="flex flex-col items-center justify-center px-6 py-12 text-center">
      {/* Placeholder circular image */}
      <div className="w-32 h-32 rounded-full border-2 border-muted bg-card mb-8 flex items-center justify-center">
        <Image className="h-12 w-12 text-muted-foreground" />
      </div>
      
      <h1 className="text-4xl font-bold text-foreground mb-6 leading-tight">
        Tu evento fácil<br />y rápido
      </h1>
      
      <p className="text-lg text-muted-foreground mb-8 max-w-sm leading-relaxed">
        Alquila juegos inflables, mobiliario y servicios de catering para hacer de tu celebración un momento inolvidable.
      </p>
      
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <Button variant="coolbalu" size="lg" className="w-full" onClick={() => window.location.href = "/catalog"}>
          Ver Catálogo
        </Button>
        <Button variant="coolbalu_outline" size="lg" className="w-full">
          Reservar
        </Button>
      </div>
      
      <a href="#como-funciona" className="text-coolbalu-orange font-medium mt-6 underline underline-offset-4">
        Cómo Funciona
      </a>
    </section>
  );
};