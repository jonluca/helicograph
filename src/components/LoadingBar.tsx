import Typography from "@mui/material/Typography";
import LinearProgress from "@mui/material/LinearProgress";

const LoadingBar = ({ message = "Loading...", value }: { message?: string; value?: number }) => {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
        alignItems: "center",
        justifySelf: "center",
        width: "100%",
      }}
    >
      <Typography variant={"body1"} className={"font-bold pb-1"}>
        {message}
      </Typography>
      <LinearProgress
        title={"Loading Bar"}
        variant={value ? "determinate" : "indeterminate"}
        value={value}
        sx={{
          bgcolor: "lightGray",
          borderRadius: 2,
          height: 8,
          width: "50%",
          "& .MuiLinearProgress-bar": {
            bgcolor: "black",
            borderRadius: 10,
          },
        }}
      />
    </div>
  );
};

export default LoadingBar;
