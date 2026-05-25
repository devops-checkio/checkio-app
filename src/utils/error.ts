import axios from "axios";

export function handleError(error: any, toast: any) {
  if (axios.isAxiosError(error)) {
    toast({
      title: "Error",
      description: error.response?.data.message,
      variant: "destructive",
    });
  } else {
    toast({
      title: "Error",
      description: "Se ha detectado una inconsistencia informe a rubrika",
      variant: "destructive",
    });
  }
}
